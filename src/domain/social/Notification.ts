export type NotificationType =
  | "FRIEND_REQUEST"
  | "FRIEND_ACCEPTED"
  | "TOURNAMENT_INVITE"
  | "MATCH_RESULT"
  | "ROOM_INVITE"
  | "SYSTEM";

export type NotificationRecord = {
  id: string;
  recipientUid: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};
