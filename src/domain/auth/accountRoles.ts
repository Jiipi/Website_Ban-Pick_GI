export const ACCOUNT_ROLES = ["ADMIN", "REFEREE", "PLAYER"] as const;

export type AccountRole = (typeof ACCOUNT_ROLES)[number];

export function isAccountRole(role: string): role is AccountRole {
  return ACCOUNT_ROLES.includes(role as AccountRole);
}

export function canCreateRoom(role: string | null | undefined): boolean {
  return role === "ADMIN" || role === "REFEREE";
}
