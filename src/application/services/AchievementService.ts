import type { EngagementMetricsRepository } from "@/application/ports/EngagementMetricsRepository";
import { computeAchievementProgress } from "@/domain/engagement/Achievement";
import { success } from "@/application/shared/ServiceResult";

export class AchievementService {
  constructor(private readonly metrics: EngagementMetricsRepository) {}

  async getForUser(uid: string) {
    const lifetime = await this.metrics.getLifetime(uid);
    const progress = computeAchievementProgress(lifetime as unknown as Record<string, number>);
    const unlocked = progress.filter((a) => a.unlocked).length;
    return success({
      achievements: progress,
      summary: {
        total: progress.length,
        unlocked,
        percent: Math.round((unlocked / progress.length) * 100),
      },
      metrics: lifetime,
    });
  }
}
