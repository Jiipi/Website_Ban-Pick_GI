import { prisma } from "@/lib/prisma";
import type {
  EngagementMetricsRepository,
  LifetimeMetrics,
  WindowMetrics,
} from "@/application/ports/EngagementMetricsRepository";
import type { CostCatalogRepository } from "@/application/ports/CostCatalogRepository";
import {
  calculateBuildCost,
  getWeaponIdFromSnapshot,
  type CostCatalog,
} from "@/domain/cost/CostCatalog";

type RoomLite = {
  blueUid: string | null;
  redUid: string | null;
  createdAt: Date;
  builds: Array<{
    player: string;
    characterId: string;
    rarity: number;
    consLevel: number;
    weaponRarity: number;
    enkaSnapshot: unknown;
    createdAt: Date;
  }>;
  logs: Array<{ player: string; action: string; characterId: string }>;
};

export class PrismaEngagementMetricsRepository implements EngagementMetricsRepository {
  constructor(private readonly costCatalogRepository: CostCatalogRepository) {}

  async getLifetime(uid: string): Promise<LifetimeMetrics> {
    const [rooms, costCatalog, friends, joined, finalsWon] = await Promise.all([
      this.fetchRooms(uid),
      this.costCatalogRepository.read(),
      this.countFriends(uid),
      prisma.tournamentParticipant.count({ where: { playerUid: uid } }),
      this.countTournamentsWon(uid),
    ]);

    let wins = 0;
    let losses = 0;
    let draws = 0;
    let buildsSubmitted = 0;
    const opponents = new Set<string>();
    const characters = new Set<string>();

    for (const room of rooms) {
      const isBlue = room.blueUid === uid;
      const blueCost = sumCost(room, "BLUE", costCatalog);
      const redCost = sumCost(room, "RED", costCatalog);
      const selfCost = isBlue ? blueCost : redCost;
      const oppCost = isBlue ? redCost : blueCost;
      if (selfCost === oppCost) draws++;
      else if (selfCost > oppCost) wins++;
      else losses++;

      const opp = isBlue ? room.redUid : room.blueUid;
      if (opp) opponents.add(opp);

      const ownSide = isBlue ? "BLUE" : "RED";
      for (const log of room.logs) {
        if (log.action === "PICK" && log.player === ownSide) {
          characters.add(log.characterId);
        }
      }
      for (const build of room.builds) {
        if (build.player === ownSide) buildsSubmitted++;
      }
    }

    return {
      totalMatches: rooms.length,
      totalWins: wins,
      totalLosses: losses,
      totalDraws: draws,
      uniqueOpponents: opponents.size,
      uniqueCharactersPicked: characters.size,
      buildsSubmitted,
      tournamentsJoined: joined,
      tournamentsWon: finalsWon,
      friendsCount: friends,
    };
  }

  async getWindow(uid: string, since: Date): Promise<WindowMetrics> {
    const [rooms, costCatalog, joined, friendsAdded, activityEvents] = await Promise.all([
      this.fetchRooms(uid, since),
      this.costCatalogRepository.read(),
      prisma.tournamentParticipant.count({ where: { playerUid: uid, joinedAt: { gte: since } } }),
      prisma.friendship.count({
        where: {
          status: "ACCEPTED",
          updatedAt: { gte: since },
          OR: [{ requesterUid: uid }, { addresseeUid: uid }],
        },
      }),
      prisma.activityEvent.count({ where: { actorUid: uid, createdAt: { gte: since } } }),
    ]);

    let matchesWon = 0;
    let buildsSubmitted = 0;
    for (const room of rooms) {
      const isBlue = room.blueUid === uid;
      const blueCost = sumCost(room, "BLUE", costCatalog);
      const redCost = sumCost(room, "RED", costCatalog);
      const selfCost = isBlue ? blueCost : redCost;
      const oppCost = isBlue ? redCost : blueCost;
      if (selfCost > oppCost) matchesWon++;

      const ownSide = isBlue ? "BLUE" : "RED";
      for (const build of room.builds) {
        if (build.player === ownSide && build.createdAt >= since) buildsSubmitted++;
      }
    }

    return {
      matchesPlayed: rooms.length,
      matchesWon,
      buildsSubmitted,
      tournamentsJoined: joined,
      friendsAdded,
      activityEvents,
    };
  }

  // ── Private ──

  private async fetchRooms(uid: string, since?: Date): Promise<RoomLite[]> {
    const where: Record<string, unknown> = {
      status: "FINISHED",
      OR: [{ blueUid: uid }, { redUid: uid }],
    };
    if (since) where.createdAt = { gte: since };

    const rows = await prisma.room.findMany({
      where: where as never,
      select: {
        blueUid: true,
        redUid: true,
        createdAt: true,
        builds: {
          select: {
            player: true,
            characterId: true,
            rarity: true,
            consLevel: true,
            weaponRarity: true,
            enkaSnapshot: true,
            createdAt: true,
          },
        },
        logs: { select: { player: true, action: true, characterId: true } },
      },
    });
    return rows;
  }

  private async countFriends(uid: string): Promise<number> {
    return prisma.friendship.count({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterUid: uid }, { addresseeUid: uid }],
      },
    });
  }

  private async countTournamentsWon(uid: string): Promise<number> {
    // A tournament is won when the user's participantId equals the winnerParticipantId
    // of the highest-round match in that tournament.
    const myParticipations = await prisma.tournamentParticipant.findMany({
      where: { playerUid: uid },
      select: { id: true, tournamentId: true },
    });
    if (myParticipations.length === 0) return 0;

    let count = 0;
    for (const p of myParticipations) {
      const finalMatch = await prisma.tournamentMatch.findFirst({
        where: { tournamentId: p.tournamentId },
        orderBy: [{ round: "desc" }, { matchNumber: "asc" }],
        select: { winnerParticipantId: true },
      });
      if (finalMatch?.winnerParticipantId === p.id) count++;
    }
    return count;
  }
}

function sumCost(room: RoomLite, side: "BLUE" | "RED", costCatalog: CostCatalog): number {
  return room.builds
    .filter((b) => b.player === side)
    .reduce(
      (sum, b) =>
        sum +
        calculateBuildCost(costCatalog, {
          characterId: b.characterId,
          characterRarity: b.rarity,
          consLevel: b.consLevel,
          weaponId: getWeaponIdFromSnapshot(b.enkaSnapshot),
          weaponRarity: b.weaponRarity,
        }).totalCost,
      0,
    );
}
