import type {
  ActivityEventRepository,
  CreateActivityInput,
} from "@/application/ports/ActivityEventRepository";
import type { ActivityEventRecord, ActivityEventType } from "@/domain/social/ActivityEvent";
import {
  cleanForSupabase,
  newId,
  nowIso,
  optionalRows,
  requireRow,
  supabase,
  toDate,
  toJsonObject,
  type DbRow,
} from "@/infrastructure/repositories/SupabaseRepositoryUtils";

export class SupabaseActivityEventRepository implements ActivityEventRepository {
  async create(input: CreateActivityInput): Promise<ActivityEventRecord> {
    const { data, error } = await supabase()
      .from("ActivityEvent")
      .insert(cleanForSupabase({
        id: newId(),
        actorUid: input.actorUid,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link,
        metadata: input.metadata,
        createdAt: nowIso(),
      }))
      .select("*")
      .single();

    return toRecord(requireRow(data as DbRow | null, error));
  }

  async listGlobalFeed(limit: number): Promise<ActivityEventRecord[]> {
    const { data, error } = await supabase()
      .from("ActivityEvent")
      .select("*")
      .order("createdAt", { ascending: false })
      .limit(limit);

    return optionalRows(data as DbRow[] | null, error).map(toRecord);
  }

  async listForActors(uids: string[], limit: number): Promise<ActivityEventRecord[]> {
    if (uids.length === 0) return [];
    const { data, error } = await supabase()
      .from("ActivityEvent")
      .select("*")
      .in("actorUid", uids)
      .order("createdAt", { ascending: false })
      .limit(limit);

    return optionalRows(data as DbRow[] | null, error).map(toRecord);
  }
}

function toRecord(row: DbRow): ActivityEventRecord {
  return {
    id: String(row.id),
    actorUid: String(row.actorUid),
    type: String(row.type) as ActivityEventType,
    title: String(row.title),
    body: row.body == null ? null : String(row.body),
    link: row.link == null ? null : String(row.link),
    metadata: toJsonObject(row.metadata),
    createdAt: toDate(row.createdAt),
  };
}
