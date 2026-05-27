import type { EngagementMetricsRepository } from "@/application/ports/EngagementMetricsRepository";
import { computeMissionProgress, getPeriodStart } from "@/domain/engagement/Mission";
import { success } from "@/application/shared/ServiceResult";

export class MissionService {
  constructor(private readonly metrics: EngagementMetricsRepository) {}

  async getForUser(uid: string, now = new Date()) {
    const dailyStart = getPeriodStart("daily", now);
    const weeklyStart = getPeriodStart("weekly", now);

    const [daily, weekly] = await Promise.all([
      this.metrics.getWindow(uid, dailyStart),
      this.metrics.getWindow(uid, weeklyStart),
    ]);

    const progress = computeMissionProgress(
      {
        daily: daily as unknown as Record<string, number>,
        weekly: weekly as unknown as Record<string, number>,
      },
      now,
    );

    const dailyDone = progress.filter((m) => m.period === "daily" && m.completed).length;
    const dailyTotal = progress.filter((m) => m.period === "daily").length;
    const weeklyDone = progress.filter((m) => m.period === "weekly" && m.completed).length;
    const weeklyTotal = progress.filter((m) => m.period === "weekly").length;

    return success({
      missions: progress,
      summary: { dailyDone, dailyTotal, weeklyDone, weeklyTotal },
    });
  }
}
