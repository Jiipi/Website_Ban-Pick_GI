import type { PlayerStatsRepository } from "@/application/ports/PlayerStatsRepository";
import { failure, success } from "@/application/shared/ServiceResult";

export class LeaderboardService {
  constructor(private readonly repository: PlayerStatsRepository) {}

  async getLeaderboard(limit = 50) {
    try {
      const players = await this.repository.listLeaderboard(limit);
      return success({ players });
    } catch {
      return failure(500, "Failed to load leaderboard");
    }
  }

  async getPlayerProfile(uid: string) {
    try {
      const [profile, stats, matches] = await Promise.all([
        this.repository.findPlayerProfileByUid(uid),
        this.repository.findPlayerStatsByUid(uid),
        this.repository.listPlayerMatches(uid, 20),
      ]);

      if (!profile && !stats) {
        return failure(404, "Player not found");
      }

      return success({
        profile: profile ?? { uid, nickname: uid, avatarUrl: null, displayName: null, customAvatarUrl: null },
        stats: stats ?? { uid, nickname: uid, avatarUrl: null, totalMatches: 0, wins: 0, losses: 0, draws: 0 },
        matches,
      });
    } catch {
      return failure(500, "Failed to load player profile");
    }
  }
}
