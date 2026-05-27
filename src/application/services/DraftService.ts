import type { BanPickRepository, DraftLogRecord } from "@/application/ports/BanPickRepository";
import { failure, success } from "@/application/shared/ServiceResult";
import { requireClientId } from "@/application/shared/payload";
import { isDraftAction, isTeamSide } from "@/domain/common/types";
import { TURN_DURATION_SECONDS } from "@/domain/common/constants";
import { draftPolicy } from "@/domain/draft/DraftPolicy";

export class DraftService {
  constructor(private readonly repository: BanPickRepository) {}

  async submitAction(payload: Record<string, unknown>) {
    const roomCode = String(payload.roomCode ?? "").toUpperCase();
    const clientIdResult = requireClientId(payload);
    if (!clientIdResult.ok) return clientIdResult;

    const player = payload.player;
    const action = payload.action;
    const characterIds: string[] = Array.isArray(payload.characterIds) ? payload.characterIds.map(String) : [];

    if (!roomCode || !isTeamSide(player) || !isDraftAction(action)) {
      return failure(400, "Invalid draft payload");
    }

    return this.repository.withTransaction(async (tx) => {
      const room = await tx.findRoomWithLogsByCode(roomCode);
      if (!room) return failure(404, "Room not found");

      // Reject actions while paused
      if (room.isPaused) {
        return failure(400, "Match đang tạm dừng");
      }

      const slotClientId = player === "BLUE" ? room.blueClientId : room.redClientId;
      if (!slotClientId || slotClientId !== clientIdResult.data) {
        return failure(403, `Ban khong phai ${player === "BLUE" ? "Doi Xanh" : "Doi Do"}`);
      }

      // Resolve turns from room's draft template
      const turns = draftPolicy.resolveTurns(room.draftTemplate);
      const validation = draftPolicy.validateDraftAction({ logs: room.logs, player, action, characterIds, turns });
      if (!validation.ok) {
        return failure(400, validation.message);
      }

      // ── Bank time calculation ──
      let bankTimeUsed = 0;
      let newBlueBankTime = room.blueBankTime;
      let newRedBankTime = room.redBankTime;

      if (room.lastTurnStartedAt) {
        const turnStart = new Date(room.lastTurnStartedAt).getTime();
        const now = Date.now();
        const elapsedSec = Math.floor((now - turnStart) / 1000);
        const overtime = Math.max(0, elapsedSec - TURN_DURATION_SECONDS);

        if (overtime > 0) {
          bankTimeUsed = overtime;
          if (player === "BLUE") {
            newBlueBankTime = Math.max(0, room.blueBankTime - overtime);
          } else {
            newRedBankTime = Math.max(0, room.redBankTime - overtime);
          }
        }
      }

      const created: DraftLogRecord[] = [];
      for (const characterId of characterIds) {
        created.push(await tx.createDraftLog({
          roomId: room.id,
          player,
          action,
          characterId,
          turnNumber: validation.currentTurn.turnNumber,
        }));
      }

      // Update room: bank time + lastTurnStartedAt for next turn
      const lastTurnNumber = draftPolicy.getLastTurnNumber(turns);
      const roomUpdate: Record<string, unknown> = {
        blueBankTime: newBlueBankTime,
        redBankTime: newRedBankTime,
        lastTurnStartedAt: new Date(), // Start of next turn
      };

      if (validation.currentTurn.turnNumber === lastTurnNumber) {
        roomUpdate.status = "BUILDING";
      } else if (room.status === "WAITING") {
        roomUpdate.status = "DRAFTING";
      }

      await tx.updateRoom(room.id, roomUpdate);

      return success({
        logs: created,
        serverTime: new Date().toISOString(),
        bankTimeUsed,
        blueBankTime: newBlueBankTime,
        redBankTime: newRedBankTime,
      });
    });
  }

  async undoTurn(roomCode: string, turnNumber: number) {
    return this.repository.withTransaction(async (tx) => {
      const room = await tx.findRoomWithLogsByCode(roomCode);
      if (!room) return failure(404, "Room not found");

      const logEntry = room.logs.find((l) => l.turnNumber === turnNumber);
      if (!logEntry) return failure(400, "Turn not found");

      // Delete the log entry
      await tx.deleteDraftLogByTurnNumber(room.id, turnNumber);

      // Reset turn timer
      await tx.updateRoom(room.id, { lastTurnStartedAt: new Date() });

      return success({ ok: true, undone: true, turnNumber });
    });
  }
}
