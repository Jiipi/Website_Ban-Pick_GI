import type { BanPickRepository } from "@/application/ports/BanPickRepository";
import type { EnkaGateway } from "@/application/ports/EnkaGateway";
import { failure, success } from "@/application/shared/ServiceResult";

const MAX_DISPLAY_NAME_LENGTH = 24;

export class ProfileService {
  constructor(
    private readonly repository: BanPickRepository,
    private readonly enkaGateway: EnkaGateway,
  ) {}

  async getCurrentPlayer(clientId: string) {
    if (!clientId) return failure(400, "Missing clientId");
    const player = await this.repository.findLobbyPlayerByClientId(clientId);
    if (!player) return failure(404, "Chua dang ky UID");
    return success({
      uid: player.uid,
      nickname: player.displayName ?? player.nickname,
      avatarUrl: player.customAvatarUrl ?? player.avatarUrl,
    });
  }

  async getProfile(clientId: string) {
    if (!clientId) {
      return failure(400, "Missing clientId");
    }

    const player = await this.repository.findLobbyPlayerByClientId(clientId);
    if (!player) {
      return failure(404, "Chua dang ky UID");
    }

    const enka = await this.enkaGateway.fetchProfile(player.uid);
    if (!enka.ok) {
      return success({
        profile: {
          uid: player.uid,
          nickname: player.nickname,
          displayName: player.displayName,
          avatarUrl: player.customAvatarUrl ?? player.avatarUrl,
          defaultAvatarUrl: player.avatarUrl,
          level: 0,
          signature: null,
          showcase: [],
        },
        stale: true,
        message: enka.message,
      });
    }

    if (
      enka.profile.nickname !== player.nickname ||
      (enka.profile.avatarUrl ?? null) !== (player.avatarUrl ?? null)
    ) {
      await this.repository.updateLobbyPlayerById(player.id, {
        nickname: enka.profile.nickname,
        avatarUrl: enka.profile.avatarUrl ?? null,
      });
    }

    const { byAvatarId } = await this.enkaGateway.loadCharacterMap();
    const showcase = enka.profile.showcase.map((character) => {
      const meta = byAvatarId[String(character.avatarId)];
      return {
        ...character,
        name: meta?.name ?? character.characterId,
        iconUrl: meta?.iconName ? `https://enka.network/ui/${meta.iconName}.png` : null,
        element: meta?.element ?? "None",
      };
    });

    return success({
      profile: {
        uid: enka.profile.uid,
        nickname: enka.profile.nickname,
        displayName: player.displayName,
        level: enka.profile.level,
        signature: enka.profile.signature ?? null,
        avatarUrl: player.customAvatarUrl ?? enka.profile.avatarUrl ?? null,
        defaultAvatarUrl: enka.profile.avatarUrl ?? null,
        showcase,
      },
    });
  }

  async updateProfile(clientId: string, payload: Record<string, unknown>) {
    if (!clientId) {
      return failure(400, "Missing clientId");
    }

    const player = await this.repository.findLobbyPlayerByClientId(clientId);
    if (!player) {
      return failure(404, "Chua dang ky UID");
    }

    const updates: { displayName?: string | null; customAvatarUrl?: string | null } = {};

    if ("displayName" in payload) {
      const raw = payload.displayName;
      if (raw === null || raw === "") {
        updates.displayName = null;
      } else if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (trimmed.length === 0) {
          updates.displayName = null;
        } else if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
          return failure(400, `Ten hien thi toi da ${MAX_DISPLAY_NAME_LENGTH} ky tu`);
        } else {
          updates.displayName = trimmed;
        }
      }
    }

    if ("customAvatarUrl" in payload) {
      const raw = payload.customAvatarUrl;
      if (raw === null || raw === "") {
        updates.customAvatarUrl = null;
      } else if (typeof raw === "string") {
        if (!/^https:\/\/enka\.network\/ui\/[\w-]+\.png$/.test(raw)) {
          return failure(400, "Avatar URL khong hop le");
        }
        updates.customAvatarUrl = raw;
      }
    }

    if (Object.keys(updates).length === 0) {
      return failure(400, "Khong co thay doi");
    }

    const updated = await this.repository.updateLobbyPlayerById(player.id, updates);

    return success({
      profile: {
        uid: updated.uid,
        nickname: updated.nickname,
        displayName: updated.displayName,
        avatarUrl: updated.customAvatarUrl ?? updated.avatarUrl,
        defaultAvatarUrl: updated.avatarUrl,
      },
    });
  }
}
