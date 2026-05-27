import type { ActivityEventRecord, ActivityEventType } from "@/domain/social/ActivityEvent";

export type CreateActivityInput = {
  actorUid: string;
  type: ActivityEventType;
  title: string;
  body: string | null;
  link: string | null;
  metadata: Record<string, unknown> | null;
};

export interface ActivityEventRepository {
  create(input: CreateActivityInput): Promise<ActivityEventRecord>;
  listGlobalFeed(limit: number): Promise<ActivityEventRecord[]>;
  listForActors(uids: string[], limit: number): Promise<ActivityEventRecord[]>;
}
