export type ActivityEventType =
  | "MATCH_FINISHED"
  | "TOURNAMENT_CREATED"
  | "TOURNAMENT_FINISHED"
  | "FRIEND_ADDED"
  | "PROFILE_UPDATED";

export type ActivityEventRecord = {
  id: string;
  actorUid: string;
  type: ActivityEventType;
  title: string;
  body: string | null;
  link: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};
