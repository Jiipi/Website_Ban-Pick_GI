import type { BanPickRepository } from "@/application/ports/BanPickRepository";
import { failure, success } from "@/application/shared/ServiceResult";
import { requireClientId } from "@/application/shared/payload";
import { isValidCostPerPoint, TURN_DURATION_SECONDS, BANK_TIME_SECONDS, TOTAL_BUILDS } from "@/domain/common/constants";
import { draftPolicy, SKIPPED_CHARACTER_ID } from "@/domain/draft/DraftPolicy";
import { normalizeConstraints } from "@/domain/tournament/TournamentConstraints";
import { isValidDiscordWebhookUrl } from "@/domain/webhook/DiscordWebhook";
import { canPause, canUnpause, isPauseReason, pauseRoom, unpauseRoom } from "@/domain/draft/PausePolicy";
import { getTemplateById, DRAFT_TEMPLATES } from "@/domain/draft/DraftTemplate";
import {
  isSeriesFormat,
  generateSeriesId,
  getSeriesState,
  canStartNextGame,
  getNextGameSides,
  getFearlessBannedCharacters,
} from "@/domain/series/SeriesPolicy";

type HostAction =
  | "RESET_DRAFT" | "RESET_BUILDS" | "UPDATE_COST"
  | "KICK_PLAYER" | "FORCE_SKIP" | "START_DRAFT" | "START_BUILD" | "FINISH_MATCH" | "SWAP_TEAMS"
  | "SET_CONSTRAINTS" | "SET_DRAFT_TEMPLATE"
  | "PAUSE_MATCH" | "UNPAUSE_MATCH"
  | "SET_SERIES_FORMAT" | "START_NEXT_GAME"
  | "RECORD_GAME_WINNER"
  | "SET_TEAM_BRANDING" | "ADD_CASTER" | "REMOVE_CASTER" | "SET_SPECTATOR_DELAY"
  | "SET_DISCORD_WEBHOOK";

const HOST_ACTIONS = new Set<string>([
  "RESET_DRAFT", "RESET_BUILDS", "UPDATE_COST",
  "KICK_PLAYER", "FORCE_SKIP", "START_DRAFT", "START_BUILD", "FINISH_MATCH", "SWAP_TEAMS",
  "SET_CONSTRAINTS", "SET_DRAFT_TEMPLATE",
  "PAUSE_MATCH", "UNPAUSE_MATCH",
  "SET_SERIES_FORMAT", "START_NEXT_GAME",
  "RECORD_GAME_WINNER",
  "SET_TEAM_BRANDING", "ADD_CASTER", "REMOVE_CASTER", "SET_SPECTATOR_DELAY",
  "SET_DISCORD_WEBHOOK",
]);

function isHostAction(value: unknown): value is HostAction {
  return typeof value === "string" && HOST_ACTIONS.has(value);
}

export class HostRoomService {
  constructor(private readonly repository: BanPickRepository) {}

  async handleAction(roomCode: string, payload: Record<string, unknown>) {
    const clientIdResult = requireClientId(payload);
    if (!clientIdResult.ok) return clientIdResult;

    if (!isHostAction(payload.action)) {
      return failure(400, "Invalid host action");
    }

    const room = await this.repository.findRoomByCode(roomCode.toUpperCase());
    if (!room) return failure(404, "Room not found");

    if (room.hostClientId !== clientIdResult.data) {
      return failure(403, "Chi host moi co quyen");
    }

    switch (payload.action) {
      case "RESET_DRAFT":
        await this.repository.withTransaction(async (tx) => {
          await tx.deleteDraftLogs(room.id);
          await tx.deleteCharacterBuilds(room.id);
          await tx.updateRoom(room.id, {
            status: "WAITING",
            blueBankTime: BANK_TIME_SECONDS,
            redBankTime: BANK_TIME_SECONDS,
            lastTurnStartedAt: null,
            isPaused: false,
            pausedAt: null,
            pauseReason: null,
          });
        });
        return success({ ok: true });

      case "RESET_BUILDS":
        await this.repository.withTransaction(async (tx) => {
          await tx.deleteCharacterBuilds(room.id);
          await tx.updateRoom(room.id, { status: "BUILDING" });
        });
        return success({ ok: true });

      case "UPDATE_COST": {
        const costPerPoint = Number(payload.costPerPoint);
        if (!isValidCostPerPoint(costPerPoint)) {
          return failure(400, "costPerPoint phai la so nguyen tu 1 den 60");
        }
        const updated = await this.repository.updateRoom(room.id, { costPerPoint });
        return success({ room: updated });
      }

      case "START_DRAFT": {
        if (room.status !== "WAITING") {
          return failure(400, "Can trang thai WAITING de bat dau draft");
        }
        const started = await this.repository.updateRoom(room.id, {
          status: "DRAFTING",
          lastTurnStartedAt: new Date(),
          blueBankTime: BANK_TIME_SECONDS,
          redBankTime: BANK_TIME_SECONDS,
        });
        return success({ room: started });
      }

      case "START_BUILD": {
        const logs = await this.repository.findDraftLogs(room.id);
        const turns = draftPolicy.resolveTurns(room.draftTemplate);
        if (logs.length < turns.length) {
          return failure(400, "Chưa thể vào build khi draft chưa hoàn tất");
        }
        if (room.status !== "DRAFTING") {
          return failure(400, "Chỉ chuyển build từ trạng thái DRAFTING");
        }
        const updated = await this.repository.updateRoom(room.id, { status: "BUILDING" });
        return success({ room: updated });
      }

      case "FINISH_MATCH": {
        if (room.status !== "BUILDING") {
          return failure(400, "Chỉ tổng kết từ trạng thái BUILDING");
        }
        const buildCount = await this.repository.countCharacterBuilds(room.id);
        if (buildCount < TOTAL_BUILDS) {
          return failure(400, `Chưa đủ build để tổng kết (${buildCount}/${TOTAL_BUILDS}). Hai đội cần bấm Lưu trước.`);
        }
        const updated = await this.repository.updateRoom(room.id, { status: "FINISHED" });
        return success({ room: updated });
      }

      case "KICK_PLAYER": {
        const target = payload.target;
        if (target !== "BLUE" && target !== "RED") {
          return failure(400, "Invalid target");
        }
        const updated = await this.repository.updateRoom(room.id, target === "BLUE"
          ? { blueClientId: null, bluePlayerName: null }
          : { redClientId: null, redPlayerName: null });
        return success({ room: updated });
      }

      case "FORCE_SKIP": {
        const result = await this.repository.withTransaction(async (tx) => {
          const logs = await tx.findDraftLogs(room.id);
          const turns = draftPolicy.resolveTurns(room.draftTemplate);
          const currentTurn = draftPolicy.getCurrentTurn(logs, turns);
          if (!currentTurn) return failure(400, "Draft da ket thuc");

          // Deduct bank time for the overtime
          let newBlueBankTime = room.blueBankTime;
          let newRedBankTime = room.redBankTime;
          if (room.lastTurnStartedAt) {
            const elapsed = Math.floor((Date.now() - new Date(room.lastTurnStartedAt).getTime()) / 1000);
            const overtime = Math.max(0, elapsed - TURN_DURATION_SECONDS);
            if (overtime > 0) {
              if (currentTurn.player === "BLUE") {
                newBlueBankTime = Math.max(0, room.blueBankTime - overtime);
              } else {
                newRedBankTime = Math.max(0, room.redBankTime - overtime);
              }
            }
          }

          await tx.createDraftLog({
            roomId: room.id,
            player: currentTurn.player,
            action: currentTurn.action,
            characterId: SKIPPED_CHARACTER_ID,
            turnNumber: currentTurn.turnNumber,
          });

          const lastTurnNumber = draftPolicy.getLastTurnNumber(turns);
          const roomUpdate: Record<string, unknown> = {
            blueBankTime: newBlueBankTime,
            redBankTime: newRedBankTime,
            lastTurnStartedAt: new Date(),
          };

          if (currentTurn.turnNumber !== lastTurnNumber && room.status === "WAITING") {
            roomUpdate.status = "DRAFTING";
          }

          await tx.updateRoom(room.id, roomUpdate);

          return success({ ok: true, skipped: true, blueBankTime: newBlueBankTime, redBankTime: newRedBankTime });
        });

        return result;
      }

      case "SWAP_TEAMS": {
        if (room.status !== "WAITING") {
          return failure(400, "Chi doi duoc team khi dang cho");
        }
        const updated = await this.repository.updateRoom(room.id, {
          blueClientId: room.redClientId,
          bluePlayerName: room.redPlayerName,
          blueUid: room.redUid,
          blueNickname: room.redNickname,
          blueAvatarUrl: room.redAvatarUrl,
          redClientId: room.blueClientId,
          redPlayerName: room.bluePlayerName,
          redUid: room.blueUid,
          redNickname: room.blueNickname,
          redAvatarUrl: room.blueAvatarUrl,
        });
        return success({ room: updated });
      }

      case "SET_CONSTRAINTS": {
        if (room.status !== "WAITING") {
          return failure(400, "Chỉ có thể thay đổi luật khi phòng đang chờ");
        }
        const constraints = normalizeConstraints(payload.constraints);
        const updated = await this.repository.updateRoom(room.id, { constraints });
        return success({ room: updated, constraints });
      }

      // ── Feature 16: Draft Template ──
      case "SET_DRAFT_TEMPLATE": {
        if (room.status !== "WAITING") {
          return failure(400, "Chỉ thay đổi template khi phòng đang chờ");
        }
        const templateId = String(payload.templateId ?? "");
        if (!DRAFT_TEMPLATES[templateId]) {
          return failure(400, "Template không hợp lệ");
        }
        const template = getTemplateById(templateId);
        const updated = await this.repository.updateRoom(room.id, {
          draftTemplate: { id: template.id, name: template.name },
        });
        return success({ room: updated, template });
      }

      // ── Feature 17: Pause ──
      case "PAUSE_MATCH": {
        if (!canPause(room)) {
          return failure(400, "Không thể pause trạng thái hiện tại");
        }
        const reason = isPauseReason(payload.reason) ? payload.reason : "TECHNICAL";
        const updated = await this.repository.updateRoom(room.id, pauseRoom(reason));
        return success({ room: updated });
      }

      case "UNPAUSE_MATCH": {
        if (!canUnpause(room)) {
          return failure(400, "Match không đang pause");
        }
        const updated = await this.repository.updateRoom(room.id, unpauseRoom(room));
        return success({ room: updated });
      }

      // ── Feature 13: Series ──
      case "SET_SERIES_FORMAT": {
        if (room.status !== "WAITING") {
          return failure(400, "Chỉ thay đổi format khi phòng đang chờ");
        }
        const format = payload.format;
        if (!isSeriesFormat(format)) {
          return failure(400, "Format không hợp lệ (BO1, BO3, BO5, BO7)");
        }
        const fearless = payload.fearless === true;
        const seriesId = room.seriesId ?? generateSeriesId();
        const updated = await this.repository.updateRoom(room.id, {
          seriesId,
          seriesFormat: format,
          gameNumber: room.gameNumber ?? 1,
          fearlessDraft: fearless,
        });
        return success({ room: updated });
      }

      case "START_NEXT_GAME": {
        if (!room.seriesId) {
          return failure(400, "Room không thuộc series nào");
        }
        // Get all rooms in this series
        const seriesRooms = await this.repository.findRoomsBySeriesId(room.seriesId);
        const state = getSeriesState(seriesRooms);
        if (!state || !canStartNextGame(state)) {
          return failure(400, "Không thể bắt đầu game tiếp theo");
        }

        const sides = getNextGameSides(state.nextGameNumber);
        const newCode = Math.random().toString(36).slice(2, 8).toUpperCase();

        // Get fearless banned characters
        let fearlessBans: string[] = [];
        if (state.fearlessDraft) {
          const previousLogs = await Promise.all(
            seriesRooms.map((r) => this.repository.findDraftLogs(r.id))
          );
          fearlessBans = getFearlessBannedCharacters(previousLogs);
        }

        // Merge fearless bans into existing constraints
        const existingConstraints = room.constraints ? normalizeConstraints(room.constraints) : null;
        const newConstraints = existingConstraints
          ? { ...existingConstraints, bannedCharacterIds: [...(existingConstraints.bannedCharacterIds ?? []), ...fearlessBans] }
          : fearlessBans.length > 0 ? { bannedCharacterIds: fearlessBans } : null;

        const newRoom = await this.repository.createRoom({
          code: newCode,
          costPerPoint: room.costPerPoint,
          hostUserId: room.hostUserId ?? undefined,
          hostName: room.hostName ?? undefined,
          hostClientId: room.hostClientId ?? undefined,
          seriesId: room.seriesId,
          seriesFormat: room.seriesFormat,
          gameNumber: state.nextGameNumber,
          fearlessDraft: room.fearlessDraft,
          draftTemplate: room.draftTemplate,
          constraints: newConstraints,
          // Swap sides on even games
          blueClientId: sides.blueIsOriginalBlue ? room.blueClientId : room.redClientId,
          bluePlayerName: sides.blueIsOriginalBlue ? room.bluePlayerName : room.redPlayerName,
          blueUid: sides.blueIsOriginalBlue ? room.blueUid : room.redUid,
          blueNickname: sides.blueIsOriginalBlue ? room.blueNickname : room.redNickname,
          blueAvatarUrl: sides.blueIsOriginalBlue ? room.blueAvatarUrl : room.redAvatarUrl,
          redClientId: sides.blueIsOriginalBlue ? room.redClientId : room.blueClientId,
          redPlayerName: sides.blueIsOriginalBlue ? room.redPlayerName : room.bluePlayerName,
          redUid: sides.blueIsOriginalBlue ? room.redUid : room.blueUid,
          redNickname: sides.blueIsOriginalBlue ? room.redNickname : room.blueNickname,
          redAvatarUrl: sides.blueIsOriginalBlue ? room.redAvatarUrl : room.blueAvatarUrl,
        });

        return success({ room: newRoom, seriesState: getSeriesState([...seriesRooms, newRoom]) });
      }

      case "RECORD_GAME_WINNER": {
        const winner = payload.winner;
        if (winner !== "BLUE" && winner !== "RED") {
          return failure(400, "Winner phải là BLUE hoặc RED");
        }
        const existingC = room.constraints ?? {};
        const updatedConstraints = { ...(typeof existingC === "object" ? existingC : {}), gameWinner: winner };
        const updated = await this.repository.updateRoom(room.id, {
          status: "FINISHED",
          constraints: updatedConstraints,
        });
        return success({ room: updated });
      }

      // ── Broadcast & Spectator ──

      case "SET_TEAM_BRANDING": {
        const branding: Record<string, unknown> = {};
        if (typeof payload.blueTeamName === "string") branding.blueTeamName = payload.blueTeamName.slice(0, 30) || null;
        if (typeof payload.blueTeamLogo === "string") branding.blueTeamLogo = payload.blueTeamLogo.slice(0, 500) || null;
        if (typeof payload.blueTeamColor === "string") branding.blueTeamColor = /^#[0-9A-Fa-f]{6}$/.test(payload.blueTeamColor) ? payload.blueTeamColor : null;
        if (typeof payload.redTeamName === "string") branding.redTeamName = payload.redTeamName.slice(0, 30) || null;
        if (typeof payload.redTeamLogo === "string") branding.redTeamLogo = payload.redTeamLogo.slice(0, 500) || null;
        if (typeof payload.redTeamColor === "string") branding.redTeamColor = /^#[0-9A-Fa-f]{6}$/.test(payload.redTeamColor) ? payload.redTeamColor : null;
        if (Object.keys(branding).length === 0) return failure(400, "Không có dữ liệu branding");
        const brandedRoom = await this.repository.updateRoom(room.id, branding);
        return success({ room: brandedRoom });
      }

      case "ADD_CASTER": {
        const casterId = typeof payload.casterClientId === "string" ? payload.casterClientId.trim() : "";
        if (!casterId) return failure(400, "Thiếu casterClientId");
        const current = room.casterClientIds ?? [];
        if (current.includes(casterId)) return failure(400, "Caster đã tồn tại");
        if (current.length >= 4) return failure(400, "Tối đa 4 caster");
        const casterRoom = await this.repository.updateRoom(room.id, {
          casterClientIds: [...current, casterId],
        });
        return success({ room: casterRoom });
      }

      case "REMOVE_CASTER": {
        const removeId = typeof payload.casterClientId === "string" ? payload.casterClientId.trim() : "";
        if (!removeId) return failure(400, "Thiếu casterClientId");
        const current2 = room.casterClientIds ?? [];
        const rmRoom = await this.repository.updateRoom(room.id, {
          casterClientIds: current2.filter((id: string) => id !== removeId),
        });
        return success({ room: rmRoom });
      }

      case "SET_SPECTATOR_DELAY": {
        const delay = Number(payload.delay);
        if (![0, 30, 60, 90].includes(delay)) return failure(400, "Delay phải là 0, 30, 60, hoặc 90 giây");
        const delayRoom = await this.repository.updateRoom(room.id, { spectatorDelay: delay });
        return success({ room: delayRoom });
      }

      case "SET_DISCORD_WEBHOOK": {
        const url = typeof payload.webhookUrl === "string" ? payload.webhookUrl.trim() : "";
        if (url && !isValidDiscordWebhookUrl(url)) {
          return failure(400, "URL webhook Discord không hợp lệ");
        }
        const webhookRoom = await this.repository.updateRoom(room.id, {
          discordWebhookUrl: url || null,
        });
        return success({ room: webhookRoom });
      }
    }
  }
}
