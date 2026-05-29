import type {
  CreateNotificationInput,
  NotificationRepository,
} from "@/application/ports/NotificationRepository";
import type { NotificationRecord, NotificationType } from "@/domain/social/Notification";
import {
  cleanForSupabase,
  newId,
  nowIso,
  optionalCount,
  optionalRows,
  requireRow,
  supabase,
  toDate,
  toJsonObject,
  type DbRow,
} from "@/infrastructure/repositories/SupabaseRepositoryUtils";

export class SupabaseNotificationRepository implements NotificationRepository {
  async create(input: CreateNotificationInput): Promise<NotificationRecord> {
    const { data, error } = await supabase()
      .from("Notification")
      .insert(cleanForSupabase({
        id: newId(),
        recipientUid: input.recipientUid,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link,
        read: false,
        metadata: input.metadata,
        createdAt: nowIso(),
      }))
      .select("*")
      .single();

    return toRecord(requireRow(data as DbRow | null, error));
  }

  async listForUser(uid: string, limit: number): Promise<NotificationRecord[]> {
    const { data, error } = await supabase()
      .from("Notification")
      .select("*")
      .eq("recipientUid", uid)
      .order("createdAt", { ascending: false })
      .limit(limit);

    return optionalRows(data as DbRow[] | null, error).map(toRecord);
  }

  async countUnread(uid: string): Promise<number> {
    const { count, error } = await supabase()
      .from("Notification")
      .select("*", { count: "exact", head: true })
      .eq("recipientUid", uid)
      .eq("read", false);
    return optionalCount(count, error);
  }

  async markAsRead(id: string, recipientUid: string): Promise<void> {
    const { error } = await supabase()
      .from("Notification")
      .update({ read: true })
      .eq("id", id)
      .eq("recipientUid", recipientUid);
    if (error) throw new Error(error.message);
  }

  async markAllAsRead(recipientUid: string): Promise<void> {
    const { error } = await supabase()
      .from("Notification")
      .update({ read: true })
      .eq("recipientUid", recipientUid)
      .eq("read", false);
    if (error) throw new Error(error.message);
  }

  async deleteOne(id: string, recipientUid: string): Promise<void> {
    const { error } = await supabase()
      .from("Notification")
      .delete()
      .eq("id", id)
      .eq("recipientUid", recipientUid);
    if (error) throw new Error(error.message);
  }
}

function toRecord(row: DbRow): NotificationRecord {
  return {
    id: String(row.id),
    recipientUid: String(row.recipientUid),
    type: String(row.type) as NotificationType,
    title: String(row.title),
    body: row.body == null ? null : String(row.body),
    link: row.link == null ? null : String(row.link),
    read: Boolean(row.read ?? false),
    metadata: toJsonObject(row.metadata),
    createdAt: toDate(row.createdAt),
  };
}
