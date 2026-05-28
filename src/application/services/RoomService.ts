import type { CharacterGateway } from "@/application/ports/CharacterGateway";
import type { CostCatalogRepository } from "@/application/ports/CostCatalogRepository";
import type { EnkaGateway } from "@/application/ports/EnkaGateway";
import type {
  BanPickRepository,
  CharacterBuildRecord,
  DraftLogRecord,
  RoomRecord,
} from "@/application/ports/BanPickRepository";
import type { UserRecord } from "@/application/ports/BanPickRepository";
import { failure, success, type ServiceResult } from "@/application/shared/ServiceResult";
import { readString, requireClientId, requireTeam, isValidUid } from "@/application/shared/payload";
import {
  DEFAULT_COST_PER_POINT,
  ROOM_CODE_LENGTH,
  isValidCostPerPoint,
  isValidName,
  sanitizeName,
} from "@/domain/common/constants";
import type { TeamSide } from "@/domain/common/types";
import { roomAccessPolicy } from "@/domain/room/RoomAccessPolicy";
import { draftPolicy } from "@/domain/draft/DraftPolicy";
import { costPolicy } from "@/domain/cost/CostPolicy";
import { calculateBuildCost, getWeaponIdFromSnapshot, getWeaponRefinementFromSnapshot, type CostCatalog } from "@/domain/cost/CostCatalog";

export class RoomService {
  constructor(
    private readonly repository: BanPickRepository,
    private readonly enkaGateway: EnkaGateway,
    private readonly characterGateway: CharacterGateway,
    private readonly costCatalogRepository: CostCatalogRepository,
  ) {}

  async createRoom(payload: Record<string, unknown>, user: UserRecord): Promise<ServiceResult<{
    room: RoomRecord;
    session: { clientId: string; name: string; role: "HOST"; team: null };
    clientId: string;
  }>> {
    const clientIdResult = requireClientId(payload);
    if (!clientIdResult.ok) return clientIdResult;

    const costPerPoint = Number(payload.costPerPoint ?? DEFAULT_COST_PER_POINT);
    if (!isValidCostPerPoint(costPerPoint)) {
      return failure(400, "costPerPoint phai la so nguyen tu 1 den 60");
    }

    const hostName = user.name?.trim() || user.email.split("@")[0];

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const room = await this.repository.createRoom({
          code: this.makeRoomCode(),
          costPerPoint,
          hostUserId: user.id,
          hostName,
          hostClientId: clientIdResult.data,
        });

        return success({
          room,
          session: { clientId: clientIdResult.data, name: hostName, role: "HOST", team: null },
          clientId: clientIdResult.data,
        });
      } catch (error) {
        if (attempt === 4) {
          return failure(500, "Could not create room");
        }
      }
    }

    return failure(500, "Could not create room");
  }

  async getRoomSnapshot(roomCode: string, clientId: string) {
    const room = await this.repository.findRoomSnapshotByCode(roomCode.toUpperCase());
    if (!room) return failure(404, "Room not found");

    const resolved = clientId ? roomAccessPolicy.resolveRole(room, clientId) : { role: null, team: null };
    if (!resolved.role) {
      return failure(403, "Ban khong co quyen truy cap phong nay");
    }

    const costCatalog = await this.costCatalogRepository.read();
    return success({
      room,
      logs: room.logs,
      builds: room.builds,
      messages: room.messages,
      costCatalog,
      session: resolved,
      serverTime: new Date().toISOString(),
    });
  }

  async requireRoomMember(roomCode: string, clientId: string) {
    if (!clientId) {
      return failure(400, "Missing clientId");
    }

    const room = await this.repository.findRoomByCode(roomCode.toUpperCase());
    if (!room) {
      return failure(404, "Room not found");
    }

    const { role, team } = roomAccessPolicy.resolveRole(room, clientId);
    if (!role) {
      return failure(403, "Ban khong co quyen truy cap phong nay");
    }

    return success({ room, role, team });
  }

  async getDraftPageData(code: string, clientId: string) {
    const room = await this.repository.findDraftPageRoomByCode(code.toUpperCase());
    if (!room) return failure(404, "Room not found");

    const { role } = roomAccessPolicy.resolveRole(room, clientId);
    if (!role) {
      return success({ authorized: false as const, room });
    }

    const characters = await this.characterGateway.getCharacters();
    return success({ authorized: true as const, room, characters });
  }

  async getBuildPageData(code: string, clientId: string) {
    const room = await this.repository.findRoomWithLogsAndBuildsByCode(code.toUpperCase());
    if (!room) return failure(404, "Room not found");

    const { role } = roomAccessPolicy.resolveRole(room, clientId);
    if (!role) {
      return success({ authorized: false as const, room });
    }

    const { list: characters } = await this.enkaGateway.loadCharacterMap();
    const bluePicks = this.toNamedPicks(room.logs, "BLUE", characters);
    const redPicks = this.toNamedPicks(room.logs, "RED", characters);

    return success({
      authorized: true as const,
      room,
      characters,
      bluePicks,
      redPicks,
    });
  }

  async getResultPageData(code: string, clientId: string) {
    const room = await this.repository.findRoomWithBuildsByCode(code.toUpperCase());
    if (!room) return failure(404, "Room not found");

    const { role } = roomAccessPolicy.resolveRole(room, clientId);
    if (!role) {
      return success({ authorized: false as const, room });
    }

    const { list: characters } = await this.enkaGateway.loadCharacterMap();
    const costCatalog = await this.costCatalogRepository.read();
    const blueBuilds = room.builds.filter((build) => build.player === "BLUE");
    const redBuilds = room.builds.filter((build) => build.player === "RED");
    const pricedBlueBuilds = this.withCatalogCosts(blueBuilds, costCatalog);
    const pricedRedBuilds = this.withCatalogCosts(redBuilds, costCatalog);
    const blueCost = this.sumBuildCost(pricedBlueBuilds, costCatalog);
    const redCost = this.sumBuildCost(pricedRedBuilds, costCatalog);
    const handicap = costPolicy.calculateHandicap(blueCost, redCost, room.costPerPoint);

    return success({
      authorized: true as const,
      room,
      characters,
      blueBuilds: pricedBlueBuilds,
      redBuilds: pricedRedBuilds,
      blueCost,
      redCost,
      handicap,
    });
  }

  async joinRoom(roomCode: string, payload: Record<string, unknown>) {
    const clientIdResult = requireClientId(payload);
    if (!clientIdResult.ok) return clientIdResult;

    const teamResult = requireTeam(payload.team);
    if (!teamResult.ok) return teamResult;

    const rawName = typeof payload.name === "string" ? payload.name : "";
    const name = sanitizeName(rawName);
    const uidRaw = readString(payload.uid);

    if (!isValidName(name)) {
      return failure(400, "Ten khong hop le");
    }

    let uid: string | null = null;
    let nickname: string | null = null;
    if (uidRaw) {
      if (!isValidUid(uidRaw)) {
        return failure(400, "UID phai la 9-10 chu so");
      }
      const enka = await this.enkaGateway.fetchProfile(uidRaw);
      if (!enka.ok) {
        return failure(enka.status === 404 ? 404 : 400, `Enka: ${enka.message}`);
      }
      uid = uidRaw;
      nickname = enka.profile.nickname;
    }

    const result = await this.repository.withTransaction(async (tx) => {
      const room = await tx.findRoomByCode(roomCode.toUpperCase());
      if (!room) return failure(404, "Room not found");

      const isBlue = teamResult.data === "BLUE";
      const slotClientId = isBlue ? room.blueClientId : room.redClientId;

      if (slotClientId && slotClientId !== clientIdResult.data) {
        return failure(409, `${isBlue ? "Blue" : "Red"} slot da co nguoi`);
      }

      const otherTeamClientId = isBlue ? room.redClientId : room.blueClientId;
      if (otherTeamClientId === clientIdResult.data) {
        return failure(409, "Ban da giu slot doi con lai");
      }

      const updated = await tx.updateRoom(room.id, isBlue
        ? { blueClientId: clientIdResult.data, bluePlayerName: name, blueUid: uid, blueNickname: nickname }
        : { redClientId: clientIdResult.data, redPlayerName: name, redUid: uid, redNickname: nickname });

      return success(updated);
    });

    if (!result.ok) return result;

    const { role, team } = roomAccessPolicy.resolveRole(result.data, clientIdResult.data);
    return success({
      room: result.data,
      session: { clientId: clientIdResult.data, name, role, team },
      enka: uid && nickname ? { uid, nickname } : null,
      clientId: clientIdResult.data,
    });
  }

  async leaveRoom(roomCode: string, payload: Record<string, unknown>) {
    const clientIdResult = requireClientId(payload);
    if (!clientIdResult.ok) return clientIdResult;

    const room = await this.repository.findRoomByCode(roomCode.toUpperCase());
    if (!room) return failure(404, "Room not found");

    if (room.blueClientId === clientIdResult.data) {
      const updated = await this.repository.updateRoom(room.id, {
        blueClientId: null,
        bluePlayerName: null,
        blueUid: null,
        blueNickname: null,
      });
      return success({ room: updated });
    }

    if (room.redClientId === clientIdResult.data) {
      const updated = await this.repository.updateRoom(room.id, {
        redClientId: null,
        redPlayerName: null,
        redUid: null,
        redNickname: null,
      });
      return success({ room: updated });
    }

    return success({ ok: true });
  }

  private makeRoomCode(): string {
    return Math.random().toString(36).slice(2, 2 + ROOM_CODE_LENGTH).toUpperCase();
  }

  private toNamedPicks(logs: DraftLogRecord[], player: TeamSide, characters: Array<{ slug: string; name: string }>) {
    return draftPolicy.getTeamPicks(logs, player).map((log) => ({
      characterId: log.characterId,
      name: characters.find((character) => character.slug === log.characterId)?.name ?? log.characterId,
    }));
  }

  private sumBuildCost(builds: CharacterBuildRecord[], costCatalog: CostCatalog): number {
    return builds.reduce((sum, build) => sum + this.calculateBuildRecordCost(build, costCatalog), 0);
  }

  private withCatalogCosts(builds: CharacterBuildRecord[], costCatalog: CostCatalog): CharacterBuildRecord[] {
    return builds.map((build) => ({
      ...build,
      totalCost: this.calculateBuildRecordCost(build, costCatalog),
    }));
  }

  private calculateBuildRecordCost(build: CharacterBuildRecord, costCatalog: CostCatalog): number {
    return calculateBuildCost(costCatalog, {
      characterId: build.characterId,
      characterRarity: build.rarity,
      consLevel: build.consLevel,
      weaponId: getWeaponIdFromSnapshot(build.enkaSnapshot),
      weaponRarity: build.weaponRarity,
      weaponRefinement: getWeaponRefinementFromSnapshot(build.enkaSnapshot),
    }).totalCost;
  }
}
