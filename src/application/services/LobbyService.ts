import type { BanPickRepository } from "@/application/ports/BanPickRepository";
import type { EnkaGateway } from "@/application/ports/EnkaGateway";
import { failure, success } from "@/application/shared/ServiceResult";
import { isValidUid, requireClientId } from "@/application/shared/payload";
import type { AuthService } from "@/application/services/AuthService";

export class LobbyService {
  constructor(
    private readonly repository: BanPickRepository,
    private readonly enkaGateway: EnkaGateway,
    private readonly authService: AuthService,
  ) {}

  async register(payload: Record<string, unknown>) {
    const clientIdResult = requireClientId(payload);
    if (!clientIdResult.ok) return clientIdResult;

    const uid = typeof payload.uid === "string" ? payload.uid.trim() : "";
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

    return success({
      player,
      enka: { nickname: enka.profile.nickname, avatarUrl: enka.profile.avatarUrl },
    });
  }

  async listOnline(uidFilter: string | null) {
    const user = await this.authService.requireUser();
    if (!user.ok) return user;

    const players = await this.repository.listLobbyPlayers({ status: "ONLINE", uid: uidFilter });
    return success({ players });
  }

  async listPublicOnline() {
    const user = await this.authService.requireUser();
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
}
