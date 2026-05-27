// ── Achievement domain ──

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum";

export type AchievementCategory =
  | "matches"
  | "wins"
  | "tournament"
  | "social"
  | "exploration";

export type AchievementDefinition = {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  /** Target value the user needs to reach */
  target: number;
  /** Hidden metric source; computed at request time */
  metric:
    | "totalMatches"
    | "totalWins"
    | "tournamentsJoined"
    | "tournamentsWon"
    | "friendsCount"
    | "uniqueOpponents"
    | "uniqueCharactersPicked";
  /** Lucide icon name */
  icon: string;
  /** Optional hint for hidden achievements */
  hidden?: boolean;
};

export type AchievementProgress = AchievementDefinition & {
  current: number;
  unlocked: boolean;
  percent: number;
};

const TIER_TARGETS = {
  bronze: 1,
  silver: 5,
  gold: 25,
  platinum: 100,
} as const;

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ── Matches ──
  { id: "first-match", name: "Bước chân đầu tiên", description: "Hoàn tất trận đầu tiên", category: "matches", tier: "bronze", target: 1, metric: "totalMatches", icon: "Sparkles" },
  { id: "veteran-5", name: "Tân binh", description: "Hoàn tất 5 trận", category: "matches", tier: "silver", target: 5, metric: "totalMatches", icon: "Swords" },
  { id: "veteran-25", name: "Cao thủ", description: "Hoàn tất 25 trận", category: "matches", tier: "gold", target: 25, metric: "totalMatches", icon: "Swords" },
  { id: "veteran-100", name: "Huyền thoại", description: "Hoàn tất 100 trận", category: "matches", tier: "platinum", target: 100, metric: "totalMatches", icon: "Crown" },

  // ── Wins ──
  { id: "first-win", name: "Chiến thắng đầu tiên", description: "Thắng trận đầu tiên", category: "wins", tier: "bronze", target: 1, metric: "totalWins", icon: "Trophy" },
  { id: "winner-10", name: "Người chiến thắng", description: "Thắng 10 trận", category: "wins", tier: "silver", target: 10, metric: "totalWins", icon: "Trophy" },
  { id: "winner-50", name: "Bá chủ", description: "Thắng 50 trận", category: "wins", tier: "gold", target: 50, metric: "totalWins", icon: "Crown" },

  // ── Tournament ──
  { id: "tournament-join", name: "Người tham chiến", description: "Tham gia 1 giải đấu", category: "tournament", tier: "bronze", target: 1, metric: "tournamentsJoined", icon: "Trophy" },
  { id: "tournament-winner", name: "Quán quân", description: "Vô địch giải đấu", category: "tournament", tier: "gold", target: 1, metric: "tournamentsWon", icon: "Award" },
  { id: "tournament-veteran", name: "Cựu chiến binh", description: "Tham gia 5 giải đấu", category: "tournament", tier: "silver", target: 5, metric: "tournamentsJoined", icon: "Calendar" },

  // ── Social ──
  { id: "first-friend", name: "Tình bằng hữu", description: "Có 1 người bạn", category: "social", tier: "bronze", target: 1, metric: "friendsCount", icon: "UserPlus" },
  { id: "friends-10", name: "Hoà đồng", description: "Có 10 người bạn", category: "social", tier: "silver", target: 10, metric: "friendsCount", icon: "Users" },
  { id: "friends-25", name: "Trung tâm cộng đồng", description: "Có 25 người bạn", category: "social", tier: "gold", target: 25, metric: "friendsCount", icon: "Users" },

  // ── Exploration ──
  { id: "diverse-picks-10", name: "Linh hoạt", description: "Pick 10 nhân vật khác nhau", category: "exploration", tier: "bronze", target: 10, metric: "uniqueCharactersPicked", icon: "Palette" },
  { id: "diverse-picks-30", name: "Đa năng", description: "Pick 30 nhân vật khác nhau", category: "exploration", tier: "silver", target: 30, metric: "uniqueCharactersPicked", icon: "Palette" },
  { id: "rivalry-5", name: "Đối thủ", description: "Đấu với 5 player khác nhau", category: "exploration", tier: "bronze", target: 5, metric: "uniqueOpponents", icon: "Target" },
  { id: "rivalry-15", name: "Người đi nhiều", description: "Đấu với 15 player khác nhau", category: "exploration", tier: "silver", target: 15, metric: "uniqueOpponents", icon: "Target" },
];

export function computeAchievementProgress(
  metrics: Record<string, number>,
): AchievementProgress[] {
  return ACHIEVEMENTS.map((def) => {
    const current = metrics[def.metric] ?? 0;
    const unlocked = current >= def.target;
    const percent = Math.min(100, Math.round((current / def.target) * 100));
    return { ...def, current, unlocked, percent };
  });
}

// Re-export for convenience
export const TIER_VALUES = TIER_TARGETS;
