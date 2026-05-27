import { permissionPolicy } from "@/domain/room/PermissionPolicy";
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

export function isHost(room: RoomLike, session: SessionLike | null): boolean {
  return permissionPolicy.isHost(room, session);
}

export function getOwnedTeam(room: RoomLike, session: SessionLike | null): TeamSide | null {
  return permissionPolicy.getOwnedTeam(room, session);
}

export function canActOnTurn(
  room: RoomLike,
  session: SessionLike | null,
  currentTurn: DraftTurn | null,
): boolean {
  return permissionPolicy.canActOnTurn(room, session, currentTurn);
}

export function canHostManage(room: RoomLike, session: SessionLike | null): boolean {
  return permissionPolicy.canHostManage(room, session);
}

export function canEditBuild(room: RoomLike, session: SessionLike | null, team: TeamSide): boolean {
  return permissionPolicy.canEditBuild(room, session, team);
}

export function isAuthorizedRoomMember(room: RoomLike, session: SessionLike | null): boolean {
  return permissionPolicy.isAuthorizedRoomMember(room, session);
}
