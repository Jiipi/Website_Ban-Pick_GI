export type PlayerStatsRecord = {
  uid: string;
  nickname: string;
  avatarUrl: string | null;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
};

export type PlayerMatchRecord = {
  roomCode: string;
  side: "BLUE" | "RED";
  selfCost: number;
  opponentCost: number;
  opponentName: string | null;
  opponentUid: string | null;
  result: "WIN" | "LOSS" | "DRAW";
  picks: string[];
  bans: string[];
  date: Date;
  status: string;
};

export type PlayerProfileRecord = {
  uid: string;
  nickname: string;
  avatarUrl: string | null;
  displayName: string | null;
  customAvatarUrl: string | null;
};

export interface PlayerStatsRepository {
  listLeaderboard(limit: number): Promise<PlayerStatsRecord[]>;
  findPlayerProfileByUid(uid: string): Promise<PlayerProfileRecord | null>;
  findPlayerStatsByUid(uid: string): Promise<PlayerStatsRecord | null>;
  listPlayerMatches(uid: string, limit: number): Promise<PlayerMatchRecord[]>;
}
