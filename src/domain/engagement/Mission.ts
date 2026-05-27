// ── Mission domain ──

export type MissionPeriod = "daily" | "weekly";

export type MissionDefinition = {
  id: string;
  name: string;
  description: string;
  period: MissionPeriod;
  target: number;
  metric:
    | "matchesPlayed"
    | "matchesWon"
    | "buildsSubmitted"
    | "tournamentsJoined"
    | "friendsAdded"
    | "activityEvents";
  /** Reward shown only as label (no real currency yet) */
  rewardLabel: string;
  icon: string;
};

export type MissionProgress = MissionDefinition & {
  current: number;
  completed: boolean;
  percent: number;
  /** When the period resets (epoch ms) */
  resetAt: number;
};

export const MISSIONS: MissionDefinition[] = [
  // ── Daily ──
  { id: "daily-play-1", name: "Chơi 1 trận", description: "Hoàn tất ít nhất 1 trận hôm nay", period: "daily", target: 1, metric: "matchesPlayed", rewardLabel: "+10 EXP", icon: "Swords" },
  { id: "daily-win-1", name: "Thắng 1 trận", description: "Giành chiến thắng 1 lần hôm nay", period: "daily", target: 1, metric: "matchesWon", rewardLabel: "+25 EXP", icon: "Trophy" },
  { id: "daily-build-2", name: "Submit 2 build", description: "Submit build 2 lần hôm nay", period: "daily", target: 2, metric: "buildsSubmitted", rewardLabel: "+15 EXP", icon: "Hammer" },
  { id: "daily-social", name: "Tương tác cộng đồng", description: "Tạo ít nhất 1 hoạt động hôm nay (trận, giải, kết bạn)", period: "daily", target: 1, metric: "activityEvents", rewardLabel: "+10 EXP", icon: "Activity" },

  // ── Weekly ──
  { id: "weekly-play-5", name: "Chơi 5 trận", description: "Hoàn tất 5 trận tuần này", period: "weekly", target: 5, metric: "matchesPlayed", rewardLabel: "+50 EXP", icon: "Swords" },
  { id: "weekly-win-3", name: "Thắng 3 trận", description: "Giành chiến thắng 3 lần tuần này", period: "weekly", target: 3, metric: "matchesWon", rewardLabel: "+100 EXP", icon: "Trophy" },
  { id: "weekly-tournament", name: "Tham gia giải đấu", description: "Đăng ký 1 giải đấu tuần này", period: "weekly", target: 1, metric: "tournamentsJoined", rewardLabel: "+150 EXP", icon: "Award" },
  { id: "weekly-friend", name: "Kết bạn mới", description: "Thêm 1 bạn mới tuần này", period: "weekly", target: 1, metric: "friendsAdded", rewardLabel: "+30 EXP", icon: "UserPlus" },
];

/**
 * Compute the reset timestamp for a period.
 * Daily resets at 00:00 next day local; weekly resets Monday 00:00 next week.
 */
export function getResetAt(period: MissionPeriod, now = new Date()): number {
  const next = new Date(now);
  next.setHours(0, 0, 0, 0);
  if (period === "daily") {
    next.setDate(next.getDate() + 1);
  } else {
    // Move to next Monday
    const day = next.getDay(); // 0 = Sun, 1 = Mon
    const daysToMonday = day === 0 ? 1 : 8 - day;
    next.setDate(next.getDate() + daysToMonday);
  }
  return next.getTime();
}

/**
 * Get the start timestamp for the current period window.
 */
export function getPeriodStart(period: MissionPeriod, now = new Date()): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === "weekly") {
    const day = start.getDay();
    const daysSinceMonday = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - daysSinceMonday);
  }
  return start;
}

export function computeMissionProgress(
  metrics: { daily: Record<string, number>; weekly: Record<string, number> },
  now = new Date(),
): MissionProgress[] {
  return MISSIONS.map((def) => {
    const bucket = def.period === "daily" ? metrics.daily : metrics.weekly;
    const current = bucket[def.metric] ?? 0;
    const completed = current >= def.target;
    const percent = Math.min(100, Math.round((current / def.target) * 100));
    return {
      ...def,
      current,
      completed,
      percent,
      resetAt: getResetAt(def.period, now),
    };
  });
}
