export const TURN_DURATION_SECONDS = 30;
export const BANK_TIME_SECONDS = 120;
export const MAX_NAME_LENGTH = 24;
export const MIN_NAME_LENGTH = 1;
export const ROOM_CODE_LENGTH = 6;
export const MAX_CHAT_MESSAGE_LENGTH = 500;
export const MAX_CHAT_HISTORY = 100;
export const PICKS_PER_TEAM = 8;
export const TOTAL_BUILDS = PICKS_PER_TEAM * 2;
export const DEFAULT_COST_PER_POINT = 10;
export const MIN_COST_PER_POINT = 1;
export const MAX_COST_PER_POINT = 60;

export function isValidCostPerPoint(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_COST_PER_POINT && value <= MAX_COST_PER_POINT;
}

export const SESSION_KEYS = {
  clientId: "bp_client_id",
  name: "bp_name",
  role: "bp_role",
  team: "bp_team",
  roomCode: "bp_room_code",
} as const;

export function sanitizeName(raw: string): string {
  let out = "";
  for (const ch of raw) {
    const code = ch.charCodeAt(0);
    if (code < 0x20 || code === 0x7f) continue;
    out += ch;
  }
  return out.trim().slice(0, MAX_NAME_LENGTH);
}

export function isValidName(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= MIN_NAME_LENGTH && trimmed.length <= MAX_NAME_LENGTH;
}
