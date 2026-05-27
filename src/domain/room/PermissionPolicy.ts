import type { DraftTurn } from "@/domain/draft/DraftPolicy";
import type { TeamSide } from "@/domain/common/types";

type RoomLike = {
  hostClientId: string | null;
  blueClientId: string | null;
  redClientId: string | null;
  status: string;
};

type SessionLike = {
  clientId: string;
};

export class PermissionPolicy {
  isHost(room: RoomLike, session: SessionLike | null): boolean {
    return Boolean(session && room.hostClientId && room.hostClientId === session.clientId);
  }

  getOwnedTeam(room: RoomLike, session: SessionLike | null): TeamSide | null {
    if (!session) return null;
    if (room.blueClientId === session.clientId) return "BLUE";
    if (room.redClientId === session.clientId) return "RED";
    return null;
  }

  canActOnTurn(room: RoomLike, session: SessionLike | null, currentTurn: DraftTurn | null): boolean {
    if (!currentTurn || !session) return false;
    const team = this.getOwnedTeam(room, session);
    return team === currentTurn.player;
  }

  canHostManage(room: RoomLike, session: SessionLike | null): boolean {
    return this.isHost(room, session);
  }

  canEditBuild(room: RoomLike, session: SessionLike | null, team: TeamSide): boolean {
    if (!session) return false;
    if (room.status === "FINISHED") return false;
    return this.getOwnedTeam(room, session) === team;
  }

  isAuthorizedRoomMember(room: RoomLike, session: SessionLike | null): boolean {
    if (!session) return false;
    return this.isHost(room, session) || this.getOwnedTeam(room, session) !== null;
  }
}

export const permissionPolicy = new PermissionPolicy();
