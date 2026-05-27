export type UserRole = "HOST" | "PLAYER" | "CASTER";
export type TeamSide = "BLUE" | "RED";
export type RoomStatus = "WAITING" | "DRAFTING" | "BUILDING" | "FINISHED";
export type DraftAction = "BAN" | "PICK";
export type ChatRole = "HOST" | "BLUE" | "RED";

export type Session = {
  clientId: string;
  name: string;
  role: UserRole;
  team: TeamSide | null;
};

export function isTeamSide(value: unknown): value is TeamSide {
  return value === "BLUE" || value === "RED";
}

export function isDraftAction(value: unknown): value is DraftAction {
  return value === "BAN" || value === "PICK";
}

export function isUserRole(value: unknown): value is UserRole {
  return value === "HOST" || value === "PLAYER" || value === "CASTER";
}

export function isRoomStatus(value: unknown): value is RoomStatus {
  return value === "WAITING" || value === "DRAFTING" || value === "BUILDING" || value === "FINISHED";
}
