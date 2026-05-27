/**
 * Aggregated metrics powering achievements & missions.
 * All queries take a Genshin UID and optional time window.
 */
export type LifetimeMetrics = {
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  uniqueOpponents: number;
  uniqueCharactersPicked: number;
  buildsSubmitted: number;
  tournamentsJoined: number;
  tournamentsWon: number;
  friendsCount: number;
};

export type WindowMetrics = {
  matchesPlayed: number;
  matchesWon: number;
  buildsSubmitted: number;
  tournamentsJoined: number;
  friendsAdded: number;
  activityEvents: number;
};

export interface EngagementMetricsRepository {
  getLifetime(uid: string): Promise<LifetimeMetrics>;
  getWindow(uid: string, since: Date): Promise<WindowMetrics>;
}
