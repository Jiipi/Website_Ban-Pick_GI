import type { BanPickRepository } from "@/application/ports/BanPickRepository";
import { failure, success } from "@/application/shared/ServiceResult";
import { isValidUid, requireClientId, requireTeam } from "@/application/shared/payload";

export class InviteService {
  constructor(private readonly repository: BanPickRepository) {}

  async invite(roomCode: string, payload: Record<string, unknown>) {
    const clientIdResult = requireClientId(payload);
    if (!clientIdResult.ok) return clientIdResult;

    const teamResult = requireTeam(payload.team);
    if (!teamResult.ok) return teamResult;

    const uid = typeof payload.uid === "string" ? payload.uid.trim() : "";
    if (!isValidUid(uid)) {
      return failure(400, "UID phai la 9-10 chu so");
    }

    const room = await this.repository.findRoomByCode(roomCode.toUpperCase());
    if (!room) return failure(404, "Room not found");

    if (room.hostClientId !== clientIdResult.data) {
      return failure(403, "Chi trong tai moi duoc moi player");
    }

    const slotTaken = teamResult.data === "BLUE" ? room.blueClientId : room.redClientId;
    if (slotTaken) {
      return failure(409, `Slot ${teamResult.data} da co nguoi`);
    }

    const lobbyPlayer = await this.repository.findOnlineLobbyPlayerByUid(uid);
    if (!lobbyPlayer) {
      return failure(404, "Player khong co trong lobby hoac da offline");
    }

    const updated = await this.repository.updateLobbyPlayerById(lobbyPlayer.id, {
      status: "INVITED",
      roomCode: room.code,
      team: teamResult.data,
    });

    return success({
      success: true,
      player: updated,
      message: `Da moi ${updated.nickname} vao team ${teamResult.data}`,
    });
  }

  async cancel(roomCode: string, payload: Record<string, unknown>) {
    const clientIdResult = requireClientId(payload);
    if (!clientIdResult.ok) return clientIdResult;

    const uid = typeof payload.uid === "string" ? payload.uid.trim() : "";
    const room = await this.repository.findRoomByCode(roomCode.toUpperCase());
    if (!room) return failure(404, "Room not found");

    if (room.hostClientId !== clientIdResult.data) {
      return failure(403, "Chi trong tai moi duoc huy moi");
    }

    if (uid) {
      await this.repository.updateLobbyPlayersByInvite({
        uid,
        roomCode: room.code,
        status: "INVITED",
        data: { status: "ONLINE", roomCode: null, team: null },
      });
    }

    return success({ ok: true });
  }

  async accept(roomCode: string, payload: Record<string, unknown>) {
    const clientIdResult = requireClientId(payload);
    if (!clientIdResult.ok) return clientIdResult;

    const lobbyPlayer = await this.repository.findLobbyPlayerByClientId(clientIdResult.data);
    if (!lobbyPlayer) {
      return failure(404, "Ban chua dang ky lobby");
    }

    if (lobbyPlayer.status !== "INVITED" || lobbyPlayer.roomCode !== roomCode.toUpperCase()) {
      return failure(404, "Khong tim thay loi moi");
    }

    const team = lobbyPlayer.team;
    if (team !== "BLUE" && team !== "RED") {
      return failure(400, "Loi moi khong hop le");
    }

    const result = await this.repository.withTransaction(async (tx) => {
      const room = await tx.findRoomByCode(roomCode.toUpperCase());
      if (!room) return failure(404, "Room not found");

      const isBlue = team === "BLUE";
      const slotClientId = isBlue ? room.blueClientId : room.redClientId;
      if (slotClientId && slotClientId !== clientIdResult.data) {
        return failure(409, "Slot da co nguoi khac");
      }

      const effectiveName = lobbyPlayer.displayName ?? lobbyPlayer.nickname;
      const effectiveAvatar = lobbyPlayer.customAvatarUrl ?? lobbyPlayer.avatarUrl;
      await tx.updateRoom(room.id, isBlue
        ? {
            blueClientId: clientIdResult.data,
            bluePlayerName: effectiveName,
            blueUid: lobbyPlayer.uid,
            blueNickname: lobbyPlayer.nickname,
            blueAvatarUrl: effectiveAvatar,
          }
        : {
            redClientId: clientIdResult.data,
            redPlayerName: effectiveName,
            redUid: lobbyPlayer.uid,
            redNickname: lobbyPlayer.nickname,
            redAvatarUrl: effectiveAvatar,
          });

      await tx.updateLobbyPlayerById(lobbyPlayer.id, { status: "IN_ROOM" });
      return success(room);
    });

    if (!result.ok) return result;

    return success({
      room: result.data,
      session: {
        clientId: clientIdResult.data,
        name: lobbyPlayer.nickname,
        role: "PLAYER" as const,
        team,
      },
      clientId: clientIdResult.data,
    });
  }

  async decline(roomCode: string, payload: Record<string, unknown>) {
    const clientIdResult = requireClientId(payload);
    if (!clientIdResult.ok) return clientIdResult;

    const lobbyPlayer = await this.repository.findLobbyPlayerByClientId(clientIdResult.data);
    if (!lobbyPlayer || lobbyPlayer.roomCode !== roomCode.toUpperCase()) {
      return success({ ok: true });
    }

    await this.repository.updateLobbyPlayerById(lobbyPlayer.id, {
      status: "ONLINE",
      roomCode: null,
      team: null,
    });

    return success({ ok: true });
  }
}
