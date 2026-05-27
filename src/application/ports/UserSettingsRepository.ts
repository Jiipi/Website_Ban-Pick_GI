import type { UserSettingsRecord, UserSettingsUpdate } from "@/domain/engagement/UserSettings";

export interface UserSettingsRepository {
  findByUid(uid: string): Promise<UserSettingsRecord | null>;
  upsert(uid: string, data: UserSettingsUpdate): Promise<UserSettingsRecord>;
}
