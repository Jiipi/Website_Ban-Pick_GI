import type { UserSettingsRepository } from "@/application/ports/UserSettingsRepository";
import { DEFAULT_SETTINGS, validateSettingsUpdate } from "@/domain/engagement/UserSettings";
import { failure, success } from "@/application/shared/ServiceResult";

export class UserSettingsService {
  constructor(private readonly repo: UserSettingsRepository) {}

  async get(uid: string) {
    const existing = await this.repo.findByUid(uid);
    if (existing) return success({ settings: existing });
    // Return defaults without persisting yet
    const now = new Date();
    return success({
      settings: { uid, ...DEFAULT_SETTINGS, createdAt: now, updatedAt: now },
    });
  }

  async update(uid: string, payload: Record<string, unknown>) {
    const validated = validateSettingsUpdate(payload);
    if (!validated.ok) return failure(400, validated.error);
    if (Object.keys(validated.data).length === 0) return failure(400, "Không có thay đổi");
    const updated = await this.repo.upsert(uid, validated.data);
    return success({ settings: updated });
  }
}
