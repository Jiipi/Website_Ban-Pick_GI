import type { NotificationRecord, NotificationType } from "@/domain/social/Notification";

export type CreateNotificationInput = {
  recipientUid: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  metadata: Record<string, unknown> | null;
};

export interface NotificationRepository {
  create(input: CreateNotificationInput): Promise<NotificationRecord>;
  listForUser(uid: string, limit: number): Promise<NotificationRecord[]>;
  countUnread(uid: string): Promise<number>;
  markAsRead(id: string, recipientUid: string): Promise<void>;
  markAllAsRead(recipientUid: string): Promise<void>;
  deleteOne(id: string, recipientUid: string): Promise<void>;
}
