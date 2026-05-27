// ── User Settings domain ──

export type UserSettingsRecord = {
  uid: string;
  // Theme & Display
  theme: "dark" | "light" | "auto";
  language: "vi" | "en" | "zh" | "ja" | "ko";
  reducedMotion: boolean;
  compactMode: boolean;
  // Sound
  soundEnabled: boolean;
  soundVolume: number;
  // Notifications
  notifyFriendRequest: boolean;
  notifyTournament: boolean;
  notifyMatchResult: boolean;
  notifyMissions: boolean;
  // Privacy
  publicProfile: boolean;
  showInLeaderboard: boolean;
  // Draft preferences
  defaultCostPerPoint: number;
  defaultBankTime: number;
  autoSubmitBuild: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type UserSettingsUpdate = Partial<Omit<UserSettingsRecord, "uid" | "createdAt" | "updatedAt">>;

export const DEFAULT_SETTINGS: Omit<UserSettingsRecord, "uid" | "createdAt" | "updatedAt"> = {
  theme: "dark",
  language: "vi",
  reducedMotion: false,
  compactMode: false,
  soundEnabled: true,
  soundVolume: 70,
  notifyFriendRequest: true,
  notifyTournament: true,
  notifyMatchResult: true,
  notifyMissions: true,
  publicProfile: true,
  showInLeaderboard: true,
  defaultCostPerPoint: 10,
  defaultBankTime: 120,
  autoSubmitBuild: false,
};

export function validateSettingsUpdate(input: Record<string, unknown>): { ok: true; data: UserSettingsUpdate } | { ok: false; error: string } {
  const out: UserSettingsUpdate = {};

  if ("theme" in input) {
    if (!["dark", "light", "auto"].includes(String(input.theme))) return { ok: false, error: "theme không hợp lệ" };
    out.theme = input.theme as UserSettingsRecord["theme"];
  }
  if ("language" in input) {
    if (!["vi", "en", "zh", "ja", "ko"].includes(String(input.language))) return { ok: false, error: "language không hợp lệ" };
    out.language = input.language as UserSettingsRecord["language"];
  }
  for (const bool of ["reducedMotion", "compactMode", "soundEnabled", "notifyFriendRequest", "notifyTournament", "notifyMatchResult", "notifyMissions", "publicProfile", "showInLeaderboard", "autoSubmitBuild"] as const) {
    if (bool in input) {
      out[bool] = Boolean(input[bool]);
    }
  }
  if ("soundVolume" in input) {
    const v = Number(input.soundVolume);
    if (!Number.isFinite(v) || v < 0 || v > 100) return { ok: false, error: "soundVolume phải từ 0-100" };
    out.soundVolume = Math.round(v);
  }
  if ("defaultCostPerPoint" in input) {
    const v = Number(input.defaultCostPerPoint);
    if (!Number.isFinite(v) || v < 1 || v > 100) return { ok: false, error: "defaultCostPerPoint phải từ 1-100" };
    out.defaultCostPerPoint = Math.round(v);
  }
  if ("defaultBankTime" in input) {
    const v = Number(input.defaultBankTime);
    if (!Number.isFinite(v) || v < 30 || v > 600) return { ok: false, error: "defaultBankTime phải từ 30-600" };
    out.defaultBankTime = Math.round(v);
  }

  return { ok: true, data: out };
}
