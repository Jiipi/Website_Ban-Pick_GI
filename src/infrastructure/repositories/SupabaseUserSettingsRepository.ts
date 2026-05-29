import type { UserSettingsRepository } from "@/application/ports/UserSettingsRepository";
import type { UserSettingsRecord, UserSettingsUpdate } from "@/domain/engagement/UserSettings";
import { DEFAULT_SETTINGS } from "@/domain/engagement/UserSettings";
import {
  cleanForSupabase,
  newId,
  nowIso,
  requireRow,
  supabase,
  toDate,
  type DbRow,
} from "@/infrastructure/repositories/SupabaseRepositoryUtils";

export class SupabaseUserSettingsRepository implements UserSettingsRepository {
  async findByUid(uid: string): Promise<UserSettingsRecord | null> {
    const { data, error } = await supabase()
      .from("UserSettings")
      .select("*")
      .eq("uid", uid)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? toRecord(data as DbRow) : null;
  }

  async upsert(uid: string, data: UserSettingsUpdate): Promise<UserSettingsRecord> {
    const existing = await this.findByUid(uid);
    const timestamp = nowIso();

    if (existing) {
      const { data: row, error } = await supabase()
        .from("UserSettings")
        .update(cleanForSupabase({ ...data, updatedAt: timestamp }))
        .eq("uid", uid)
        .select("*")
        .single();
      return toRecord(requireRow(row as DbRow | null, error));
    }

    const { data: row, error } = await supabase()
      .from("UserSettings")
      .insert(cleanForSupabase({
        id: newId(),
        uid,
        ...DEFAULT_SETTINGS,
        ...data,
        createdAt: timestamp,
        updatedAt: timestamp,
      }))
      .select("*")
      .single();
    return toRecord(requireRow(row as DbRow | null, error));
  }
}

function toRecord(row: DbRow): UserSettingsRecord {
  return {
    uid: String(row.uid),
    theme: String(row.theme ?? "dark") as UserSettingsRecord["theme"],
    language: String(row.language ?? "vi") as UserSettingsRecord["language"],
    reducedMotion: Boolean(row.reducedMotion ?? false),
    compactMode: Boolean(row.compactMode ?? false),
    soundEnabled: Boolean(row.soundEnabled ?? true),
    soundVolume: Number(row.soundVolume ?? 70),
    notifyFriendRequest: Boolean(row.notifyFriendRequest ?? true),
    notifyTournament: Boolean(row.notifyTournament ?? true),
    notifyMatchResult: Boolean(row.notifyMatchResult ?? true),
    notifyMissions: Boolean(row.notifyMissions ?? true),
    publicProfile: Boolean(row.publicProfile ?? true),
    showInLeaderboard: Boolean(row.showInLeaderboard ?? true),
    defaultCostPerPoint: Number(row.defaultCostPerPoint ?? 10),
    defaultBankTime: Number(row.defaultBankTime ?? 120),
    autoSubmitBuild: Boolean(row.autoSubmitBuild ?? false),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}
