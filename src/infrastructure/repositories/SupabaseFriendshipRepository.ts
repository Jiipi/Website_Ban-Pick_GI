import type { FriendshipRepository } from "@/application/ports/FriendshipRepository";
import type {
  FriendProfile,
  FriendshipRecord,
  FriendshipStatus,
} from "@/domain/social/Friendship";
import {
  cleanForSupabase,
  newId,
  nowIso,
  optionalRows,
  requireRow,
  supabase,
  toDate,
  type DbRow,
} from "@/infrastructure/repositories/SupabaseRepositoryUtils";

export class SupabaseFriendshipRepository implements FriendshipRepository {
  async findFriendship(requesterUid: string, addresseeUid: string): Promise<FriendshipRecord | null> {
    const { data, error } = await supabase()
      .from("Friendship")
      .select("*")
      .eq("requesterUid", requesterUid)
      .eq("addresseeUid", addresseeUid)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? toRecord(data as DbRow) : null;
  }

  async findFriendshipPair(uidA: string, uidB: string): Promise<FriendshipRecord | null> {
    const { data, error } = await supabase()
      .from("Friendship")
      .select("*")
      .or(`and(requesterUid.eq.${uidA},addresseeUid.eq.${uidB}),and(requesterUid.eq.${uidB},addresseeUid.eq.${uidA})`)
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? toRecord(data as DbRow) : null;
  }

  async findById(id: string): Promise<FriendshipRecord | null> {
    const { data, error } = await supabase()
      .from("Friendship")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? toRecord(data as DbRow) : null;
  }

  async createRequest(requesterUid: string, addresseeUid: string): Promise<FriendshipRecord> {
    const timestamp = nowIso();
    const { data, error } = await supabase()
      .from("Friendship")
      .insert(cleanForSupabase({
        id: newId(),
        requesterUid,
        addresseeUid,
        status: "PENDING",
        createdAt: timestamp,
        updatedAt: timestamp,
      }))
      .select("*")
      .single();

    return toRecord(requireRow(data as DbRow | null, error));
  }

  async updateStatus(id: string, status: "ACCEPTED" | "BLOCKED"): Promise<FriendshipRecord> {
    const { data, error } = await supabase()
      .from("Friendship")
      .update(cleanForSupabase({ status, updatedAt: nowIso() }))
      .eq("id", id)
      .select("*")
      .single();

    return toRecord(requireRow(data as DbRow | null, error));
  }

  async deleteFriendship(id: string): Promise<void> {
    const { error } = await supabase().from("Friendship").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  async listFriends(uid: string): Promise<FriendProfile[]> {
    const rows = await this.listByFilter(uid, "ACCEPTED", true);
    return Promise.all(rows.map((row) => this.toFriendProfile(row, uid, "MUTUAL")));
  }

  async listIncomingRequests(uid: string): Promise<FriendProfile[]> {
    const { data, error } = await supabase()
      .from("Friendship")
      .select("*")
      .eq("addresseeUid", uid)
      .eq("status", "PENDING")
      .order("createdAt", { ascending: false });

    return Promise.all(optionalRows(data as DbRow[] | null, error).map((row) => this.toFriendProfile(row, uid, "INCOMING")));
  }

  async listOutgoingRequests(uid: string): Promise<FriendProfile[]> {
    const { data, error } = await supabase()
      .from("Friendship")
      .select("*")
      .eq("requesterUid", uid)
      .eq("status", "PENDING")
      .order("createdAt", { ascending: false });

    return Promise.all(optionalRows(data as DbRow[] | null, error).map((row) => this.toFriendProfile(row, uid, "OUTGOING")));
  }

  private async listByFilter(uid: string, status: string, bothSides: boolean): Promise<DbRow[]> {
    let query = supabase()
      .from("Friendship")
      .select("*")
      .eq("status", status);

    if (bothSides) {
      query = query.or(`requesterUid.eq.${uid},addresseeUid.eq.${uid}`);
    }

    const { data, error } = await query.order("updatedAt", { ascending: false });
    return optionalRows(data as DbRow[] | null, error);
  }

  private async toFriendProfile(
    row: DbRow,
    selfUid: string,
    direction: "OUTGOING" | "INCOMING" | "MUTUAL",
  ): Promise<FriendProfile> {
    const requesterUid = String(row.requesterUid);
    const addresseeUid = String(row.addresseeUid);
    const otherUid = requesterUid === selfUid ? addresseeUid : requesterUid;
    const { data, error } = await supabase()
      .from("LobbyPlayer")
      .select("uid,nickname,displayName,avatarUrl,customAvatarUrl")
      .eq("uid", otherUid)
      .order("updatedAt", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    const lobby = data as DbRow | null;

    return {
      id: String(row.id),
      uid: otherUid,
      nickname: lobby?.displayName == null
        ? lobby?.nickname == null ? otherUid : String(lobby.nickname)
        : String(lobby.displayName),
      avatarUrl: lobby?.customAvatarUrl == null
        ? lobby?.avatarUrl == null ? null : String(lobby.avatarUrl)
        : String(lobby.customAvatarUrl),
      status: String(row.status) as FriendshipStatus,
      direction,
      since: toDate(row.updatedAt),
    };
  }
}

function toRecord(row: DbRow): FriendshipRecord {
  return {
    id: String(row.id),
    requesterUid: String(row.requesterUid),
    addresseeUid: String(row.addresseeUid),
    status: String(row.status) as FriendshipStatus,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}
