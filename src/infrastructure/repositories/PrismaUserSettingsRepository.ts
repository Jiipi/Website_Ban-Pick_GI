import { prisma } from "@/lib/prisma";
import type { UserSettingsRepository } from "@/application/ports/UserSettingsRepository";
import type { UserSettingsRecord, UserSettingsUpdate } from "@/domain/engagement/UserSettings";

export class PrismaUserSettingsRepository implements UserSettingsRepository {
  async findByUid(uid: string): Promise<UserSettingsRecord | null> {
    const row = await prisma.userSettings.findUnique({ where: { uid } });
    return row ? toRecord(row) : null;
  }

  async upsert(uid: string, data: UserSettingsUpdate): Promise<UserSettingsRecord> {
    const row = await prisma.userSettings.upsert({
      where: { uid },
      create: { uid, ...data },
      update: data,
    });
    return toRecord(row);
  }
}

function toRecord(row: {
  uid: string;
  theme: string;
  language: string;
  reducedMotion: boolean;
  compactMode: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  notifyFriendRequest: boolean;
  notifyTournament: boolean;
  notifyMatchResult: boolean;
  notifyMissions: boolean;
  publicProfile: boolean;
  showInLeaderboard: boolean;
  defaultCostPerPoint: number;
  defaultBankTime: number;
  autoSubmitBuild: boolean;
  createdAt: Date;
  updatedAt: Date;
}): UserSettingsRecord {
  return {
    uid: row.uid,
    theme: row.theme as UserSettingsRecord["theme"],
    language: row.language as UserSettingsRecord["language"],
    reducedMotion: row.reducedMotion,
    compactMode: row.compactMode,
    soundEnabled: row.soundEnabled,
    soundVolume: row.soundVolume,
    notifyFriendRequest: row.notifyFriendRequest,
    notifyTournament: row.notifyTournament,
    notifyMatchResult: row.notifyMatchResult,
    notifyMissions: row.notifyMissions,
    publicProfile: row.publicProfile,
    showInLeaderboard: row.showInLeaderboard,
    defaultCostPerPoint: row.defaultCostPerPoint,
    defaultBankTime: row.defaultBankTime,
    autoSubmitBuild: row.autoSubmitBuild,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
