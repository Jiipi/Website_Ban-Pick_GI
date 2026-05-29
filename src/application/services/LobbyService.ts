import type { BanPickRepository } from "@/application/ports/BanPickRepository";
import type { EnkaGateway } from "@/application/ports/EnkaGateway";
import { failure, success } from "@/application/shared/ServiceResult";
import { isValidUid, requireClientId } from "@/application/shared/payload";
import type { AuthService } from "@/application/services/AuthService";
import type { UserRecord } from "@/application/ports/BanPickRepository";

function accountProfileClientId(userId: string): string {
  return `account:${userId}`;
}

export class LobbyService {
  constructor(
    private readonly repository: BanPickRepository,
    private readonly enkaGateway: EnkaGateway,
    private readonly authService: AuthService,
  ) {}

  async register(payload: Record<string, unknown>, accessToken?: string | null) {
    const user = await this.authService.requireUser(accessToken);
    if (!user.ok) return user;

    const clientIdResult = requireClientId(payload);
    if (!clientIdResult.ok) return clientIdResult;

    const uid = typeof payload.uid === "string" ? payload.uid.trim() : "";
    if (!uid) {
      return this.registerFromAccountProfile(clientIdResult.data, user.data);
    }

    if (!isValidUid(uid)) {
      return failure(400, "UID phai la 9-10 chu so");
    }

    const enka = await this.enkaGateway.fetchProfile(uid);
    if (!enka.ok) {
      const httpStatus = enka.status >= 500 ? 502 : enka.status === 404 ? 404 : 422;
      return failure(httpStatus, `Enka: ${enka.message}`);
    }

    const player = await this.repository.upsertLobbyPlayerByClientId({
      clientId: clientIdResult.data,
      uid,
      nickname: enka.profile.nickname,
      avatarUrl: enka.profile.avatarUrl ?? null,
    });
    await this.saveAccountProfile(user.data, {
      uid,
      nickname: enka.profile.nickname,
      avatarUrl: enka.profile.avatarUrl ?? null,
      displayName: player.displayName,
      customAvatarUrl: player.customAvatarUrl,
    });

    return success({
      player,
      enka: { nickname: enka.profile.nickname, avatarUrl: enka.profile.avatarUrl },
    });
  }

  async listOnline(uidFilter: string | null, accessToken?: string | null) {
    const user = await this.authService.requireUser(accessToken);
    if (!user.ok) return user;

    const players = await this.repository.listLobbyPlayers({ status: "ONLINE", uid: uidFilter });
    return success({ players });
  }

  async listPublicOnline(accessToken?: string | null) {
    const user = await this.authService.requireUser(accessToken);
    if (!user.ok) return user;

    const players = await this.repository.listPublicOnlineLobbyPlayers();
    return success({
      players: players.map((player) => ({
        uid: player.uid,
        nickname: player.displayName ?? player.nickname,
        avatarUrl: player.customAvatarUrl ?? player.avatarUrl,
        updatedAt: player.updatedAt,
      })),
    });
  }

  async leave(payload: Record<string, unknown>) {
    const clientIdResult = requireClientId(payload);
    if (!clientIdResult.ok) return clientIdResult;

    await this.repository.updateLobbyPlayerByClientId(clientIdResult.data, {
      status: "OFFLINE",
      roomCode: null,
      team: null,
    });

    return success({ ok: true });
  }

  private async registerFromAccountProfile(clientId: string, user: UserRecord) {
    const accountProfile = await this.repository.findLobbyPlayerByClientId(accountProfileClientId(user.id));
    if (!accountProfile) {
      return failure(400, "Chua co UID mac dinh cho tai khoan");
    }

    const player = await this.repository.upsertLobbyPlayerByClientId({
      clientId,
      uid: accountProfile.uid,
      nickname: accountProfile.nickname,
      avatarUrl: accountProfile.avatarUrl,
    });

    const updates: Record<string, unknown> = {};
    if (accountProfile.displayName !== player.displayName) updates.displayName = accountProfile.displayName;
    if (accountProfile.customAvatarUrl !== player.customAvatarUrl) updates.customAvatarUrl = accountProfile.customAvatarUrl;
    const updated = Object.keys(updates).length
      ? await this.repository.updateLobbyPlayerById(player.id, updates)
      : player;

    return success({
      player: updated,
      enka: { nickname: accountProfile.nickname, avatarUrl: accountProfile.avatarUrl },
      fromProfile: true,
    });
  }

  private async saveAccountProfile(
    user: UserRecord,
    profile: {
      uid: string;
      nickname: string;
      avatarUrl: string | null;
      displayName?: string | null;
      customAvatarUrl?: string | null;
    },
  ) {
    const accountPlayer = await this.repository.upsertLobbyPlayerByClientId({
      clientId: accountProfileClientId(user.id),
      uid: profile.uid,
      nickname: profile.nickname,
      avatarUrl: profile.avatarUrl,
    });

    await this.repository.updateLobbyPlayerById(accountPlayer.id, {
      status: "OFFLINE",
      roomCode: null,
      team: null,
      displayName: profile.displayName ?? accountPlayer.displayName,
      customAvatarUrl: profile.customAvatarUrl ?? accountPlayer.customAvatarUrl,
    });
  }
}
