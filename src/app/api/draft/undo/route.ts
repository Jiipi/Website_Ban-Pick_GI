import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = await request.json();
  const cookieStore = await cookies();
  const clientId = cookieStore.get("clientId")?.value ?? "";

  const action = String(payload.action ?? "");
  const roomCode = String(payload.roomCode ?? "").toUpperCase();

  if (!roomCode || !action) {
    return jsonResult({ ok: false, status: 400, message: "Missing roomCode or action" });
  }

  // Undo is handled via broadcast only — no DB state needed
  // The server validates the request and returns ok
  // Actual undo logic happens in the host's FORCE_UNDO action

  switch (action) {
    case "REQUEST": {
      const turnNumber = Number(payload.turnNumber ?? 0);
      if (!turnNumber) {
        return jsonResult({ ok: false, status: 400, message: "Missing turnNumber" });
      }
      // Validate the requester is a room member
      const memberResult = await services.room.requireRoomMember(roomCode, clientId);
      if (!memberResult.ok) return jsonResult(memberResult);

      return jsonResult({
        ok: true,
        data: {
          type: "UNDO_REQUEST",
          clientId,
          turnNumber,
          team: memberResult.data.team,
        },
      });
    }

    case "APPROVE": {
      const turnNumber = Number(payload.turnNumber ?? 0);
      if (!turnNumber) {
        return jsonResult({ ok: false, status: 400, message: "Missing turnNumber" });
      }

      // Actually perform the undo: delete the last log entry
      const memberResult = await services.room.requireRoomMember(roomCode, clientId);
      if (!memberResult.ok) return jsonResult(memberResult);

      const room = memberResult.data.room;

      // Only host or the opponent team can approve
      const isHost = room.hostClientId === clientId;
      const requestTeam = String(payload.requestTeam ?? "");
      if (!isHost && requestTeam && memberResult.data.team === requestTeam) {
        return jsonResult({ ok: false, status: 403, message: "Cannot approve own undo" });
      }

      // Delete the log entry for this turn
      const result = await services.draft.undoTurn(roomCode, turnNumber);
      return jsonResult(result);
    }

    case "DENY": {
      return jsonResult({ ok: true, data: { type: "UNDO_DENIED" } });
    }

    default:
      return jsonResult({ ok: false, status: 400, message: "Invalid action" });
  }
}
