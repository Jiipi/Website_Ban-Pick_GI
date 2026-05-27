import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  ActivityEventRepository,
  CreateActivityInput,
} from "@/application/ports/ActivityEventRepository";
import type { ActivityEventRecord, ActivityEventType } from "@/domain/social/ActivityEvent";

export class PrismaActivityEventRepository implements ActivityEventRepository {
  async create(input: CreateActivityInput): Promise<ActivityEventRecord> {
    const row = await prisma.activityEvent.create({
      data: {
        actorUid: input.actorUid,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link,
        metadata: (input.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
    return toRecord(row);
  }

  async listGlobalFeed(limit: number): Promise<ActivityEventRecord[]> {
    const rows = await prisma.activityEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(toRecord);
  }

  async listForActors(uids: string[], limit: number): Promise<ActivityEventRecord[]> {
    if (uids.length === 0) return [];
    const rows = await prisma.activityEvent.findMany({
      where: { actorUid: { in: uids } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(toRecord);
  }
}

function toRecord(row: {
  id: string;
  actorUid: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  metadata: unknown;
  createdAt: Date;
}): ActivityEventRecord {
  return {
    id: row.id,
    actorUid: row.actorUid,
    type: row.type as ActivityEventType,
    title: row.title,
    body: row.body,
    link: row.link,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt,
  };
}
