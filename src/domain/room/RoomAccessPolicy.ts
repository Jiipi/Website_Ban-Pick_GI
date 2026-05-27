import type { ChatRole, TeamSide, UserRole } from "@/domain/common/types";

export type RoomAccessShape = {
  hostClientId: string | null;
  blueClientId: string | null;
  redClientId: string | null;
  casterClientIds?: string[];
};

export class RoomAccessPolicy {
  resolveRole(room: RoomAccessShape, clientId: string): { role: UserRole | null; team: TeamSide | null } {
    if (!clientId) return { role: null, team: null };

    const isHost = room.hostClientId === clientId;
    const isBlue = room.blueClientId === clientId;
    const isRed = room.redClientId === clientId;

    if (isHost) {
      if (isBlue) return { role: "HOST", team: "BLUE" };
      if (isRed) return { role: "HOST", team: "RED" };
      return { role: "HOST", team: null };
    }
    if (isBlue) return { role: "PLAYER", team: "BLUE" };
    if (isRed) return { role: "PLAYER", team: "RED" };

    // Caster role
    if (room.casterClientIds?.includes(clientId)) {
      return { role: "CASTER", team: null };
    }

    return { role: null, team: null };
  }

  chatRoleFromSession(room: RoomAccessShape, clientId: string): ChatRole | null {
    if (clientId && room.blueClientId === clientId) return "BLUE";
    if (clientId && room.redClientId === clientId) return "RED";
    if (clientId && room.hostClientId === clientId) return "HOST";
    return null;
  }
}

export const roomAccessPolicy = new RoomAccessPolicy();
