import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  PlayerMatchRecord,
  PlayerProfileRecord,
  PlayerStatsRecord,
  PlayerStatsRepository,
} from "@/application/ports/PlayerStatsRepository";
import type { CostCatalogRepository } from "@/application/ports/CostCatalogRepository";
import { calculateBuildCost, getWeaponIdFromSnapshot, getWeaponRefinementFromSnapshot, type CostCatalog } from "@/domain/cost/CostCatalog";

type PrismaLike = PrismaClient | Prisma.TransactionClient;

type RoomWithBuildsLite = {
  code: string;
  status: string;
  costPerPoint: number;
  blueUid: string | null;
  redUid: string | null;
  bluePlayerName: string | null;
  redPlayerName: string | null;
  blueNickname: string | null;
  redNickname: string | null;
  blueAvatarUrl: string | null;
  redAvatarUrl: string | null;
  createdAt: Date;
  builds: Array<{
    player: string;
    characterId: string;
    rarity: number;
    consLevel: number;
    weaponRarity: number;
    enkaSnapshot: unknown;
  }>;
  logs: Array<{
    player: string;
    action: string;
    characterId: string;
  }>;
};

export class PrismaPlayerStatsRepository implements PlayerStatsRepository {
  constructor(
    private readonly costCatalogRepository: CostCatalogRepository,
    private readonly client: PrismaLike = prisma,
  ) {}

  async listLeaderboard(limit: number): Promise<PlayerStatsRecord[]> {
    const rooms = await this.fetchFinishedRoomsWithUid();
    const costCatalog = await this.costCatalogRepository.read();
    const map = new Map<string, PlayerStatsRecord>();

    for (const room of rooms) {
      const blueCost = sumCostFor(room, "BLUE", costCatalog);
      const redCost = sumCostFor(room, "RED", costCatalog);

      if (room.blueUid) {
        upsertPlayer(map, {
          uid: room.blueUid,
          nickname: room.blueNickname ?? room.bluePlayerName ?? room.blueUid,
          avatarUrl: room.blueAvatarUrl,
        });
        applyResult(map.get(room.blueUid)!, blueCost, redCost);
      }

      if (room.redUid) {
        upsertPlayer(map, {
          uid: room.redUid,
          nickname: room.redNickname ?? room.redPlayerName ?? room.redUid,
          avatarUrl: room.redAvatarUrl,
        });
        applyResult(map.get(room.redUid)!, redCost, blueCost);
      }
    }

    return Array.from(map.values())
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        const aRate = a.totalMatches > 0 ? a.wins / a.totalMatches : 0;
        const bRate = b.totalMatches > 0 ? b.wins / b.totalMatches : 0;
        if (bRate !== aRate) return bRate - aRate;
        return b.totalMatches - a.totalMatches;
      })
      .slice(0, limit);
  }

  async findPlayerProfileByUid(uid: string): Promise<PlayerProfileRecord | null> {
    const lobby = await this.client.lobbyPlayer.findFirst({
      where: { uid },
      orderBy: { updatedAt: "desc" },
    });
    if (!lobby) return null;
    return {
      uid: lobby.uid,
      nickname: lobby.nickname,
      avatarUrl: lobby.avatarUrl,
      displayName: lobby.displayName,
      customAvatarUrl: lobby.customAvatarUrl,
    };
  }

  async findPlayerStatsByUid(uid: string): Promise<PlayerStatsRecord | null> {
    const rooms = await this.fetchFinishedRoomsWithUid(uid);
    if (rooms.length === 0) return null;
    const costCatalog = await this.costCatalogRepository.read();

    let nickname = uid;
    let avatarUrl: string | null = null;
    let wins = 0;
    let losses = 0;
    let draws = 0;

    for (const room of rooms) {
      const blueCost = sumCostFor(room, "BLUE", costCatalog);
      const redCost = sumCostFor(room, "RED", costCatalog);
      const isBlue = room.blueUid === uid;
      const selfCost = isBlue ? blueCost : redCost;
      const oppCost = isBlue ? redCost : blueCost;

      if (isBlue) {
        nickname = room.blueNickname ?? room.bluePlayerName ?? nickname;
        avatarUrl = room.blueAvatarUrl ?? avatarUrl;
      } else {
        nickname = room.redNickname ?? room.redPlayerName ?? nickname;
        avatarUrl = room.redAvatarUrl ?? avatarUrl;
      }

      const result = computeResult(selfCost, oppCost);
      if (result === "WIN") wins++;
      else if (result === "LOSS") losses++;
      else draws++;
    }

    return {
      uid,
      nickname,
      avatarUrl,
      totalMatches: rooms.length,
      wins,
      losses,
      draws,
    };
  }

  async listPlayerMatches(uid: string, limit: number): Promise<PlayerMatchRecord[]> {
    const rooms = await this.fetchFinishedRoomsWithUid(uid, limit);
    const costCatalog = await this.costCatalogRepository.read();
    return rooms.map((room) => {
      const isBlue = room.blueUid === uid;
      const side: "BLUE" | "RED" = isBlue ? "BLUE" : "RED";
      const blueCost = sumCostFor(room, "BLUE", costCatalog);
      const redCost = sumCostFor(room, "RED", costCatalog);
      const selfCost = isBlue ? blueCost : redCost;
      const opponentCost = isBlue ? redCost : blueCost;
      const opponentName = isBlue
        ? room.redNickname ?? room.redPlayerName
        : room.blueNickname ?? room.bluePlayerName;
      const opponentUid = isBlue ? room.redUid : room.blueUid;
      const result = computeResult(selfCost, opponentCost);
      const picks = room.logs
        .filter((l) => l.player === side && l.action === "PICK")
        .map((l) => l.characterId);
      const bans = room.logs
        .filter((l) => l.player === side && l.action === "BAN")
        .map((l) => l.characterId);

      return {
        roomCode: room.code,
        side,
        selfCost,
        opponentCost,
        opponentName,
        opponentUid,
        result,
        picks,
        bans,
        date: room.createdAt,
        status: room.status,
      };
    });
  }

  private async fetchFinishedRoomsWithUid(uid?: string, limit = 200): Promise<RoomWithBuildsLite[]> {
    const where: Prisma.RoomWhereInput = {
      status: "FINISHED",
    };
    if (uid) {
      where.OR = [{ blueUid: uid }, { redUid: uid }];
    } else {
      where.OR = [{ blueUid: { not: null } }, { redUid: { not: null } }];
    }

    return this.client.room.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        code: true,
        status: true,
        costPerPoint: true,
        blueUid: true,
        redUid: true,
        bluePlayerName: true,
        redPlayerName: true,
        blueNickname: true,
        redNickname: true,
        blueAvatarUrl: true,
        redAvatarUrl: true,
        createdAt: true,
        builds: {
          select: {
            player: true,
            characterId: true,
            rarity: true,
            consLevel: true,
            weaponRarity: true,
            enkaSnapshot: true,
          },
        },
        logs: {
          select: { player: true, action: true, characterId: true },
        },
      },
    });
  }
}

function sumCostFor(room: RoomWithBuildsLite, side: "BLUE" | "RED", costCatalog: CostCatalog): number {
  return room.builds
    .filter((b) => b.player === side)
    .reduce((sum, b) => sum + calculateBuildCost(costCatalog, {
      characterId: b.characterId,
      characterRarity: b.rarity,
      consLevel: b.consLevel,
      weaponId: getWeaponIdFromSnapshot(b.enkaSnapshot),
      weaponRarity: b.weaponRarity,
      weaponRefinement: getWeaponRefinementFromSnapshot(b.enkaSnapshot),
    }).totalCost, 0);
}

function computeResult(selfCost: number, opponentCost: number): "WIN" | "LOSS" | "DRAW" {
  if (selfCost === opponentCost) return "DRAW";
  // Higher cost = stronger build = winner per project convention
  return selfCost > opponentCost ? "WIN" : "LOSS";
}

function upsertPlayer(
  map: Map<string, PlayerStatsRecord>,
  data: { uid: string; nickname: string; avatarUrl: string | null },
) {
  const existing = map.get(data.uid);
  if (existing) {
    if (data.avatarUrl) existing.avatarUrl = data.avatarUrl;
    existing.nickname = data.nickname;
    return;
  }
  map.set(data.uid, {
    uid: data.uid,
    nickname: data.nickname,
    avatarUrl: data.avatarUrl,
    totalMatches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
  });
}

function applyResult(player: PlayerStatsRecord, selfCost: number, oppCost: number) {
  player.totalMatches++;
  const result = computeResult(selfCost, oppCost);
  if (result === "WIN") player.wins++;
  else if (result === "LOSS") player.losses++;
  else player.draws++;
}
