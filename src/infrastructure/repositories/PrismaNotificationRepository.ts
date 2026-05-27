import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreateNotificationInput,
  NotificationRepository,
} from "@/application/ports/NotificationRepository";
import type { NotificationRecord, NotificationType } from "@/domain/social/Notification";

export class PrismaNotificationRepository implements NotificationRepository {
  async create(input: CreateNotificationInput): Promise<NotificationRecord> {
    const row = await prisma.notification.create({
      data: {
        recipientUid: input.recipientUid,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link,
        metadata: (input.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
    return toRecord(row);
  }

  async listForUser(uid: string, limit: number): Promise<NotificationRecord[]> {
    const rows = await prisma.notification.findMany({
      where: { recipientUid: uid },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(toRecord);
  }

  async countUnread(uid: string): Promise<number> {
    return prisma.notification.count({ where: { recipientUid: uid, read: false } });
  }

  async markAsRead(id: string, recipientUid: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { id, recipientUid },
      data: { read: true },
    });
  }

  async markAllAsRead(recipientUid: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { recipientUid, read: false },
      data: { read: true },
    });
  }

  async deleteOne(id: string, recipientUid: string): Promise<void> {
    await prisma.notification.deleteMany({ where: { id, recipientUid } });
  }
}

function toRecord(row: {
  id: string;
  recipientUid: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  metadata: unknown;
  createdAt: Date;
}): NotificationRecord {
  return {
    id: row.id,
    recipientUid: row.recipientUid,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    link: row.link,
    read: row.read,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt,
  };
}
