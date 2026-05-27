import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CharacterStatsRepository,
  CharacterStatsRecord,
  RecentMatchRecord,
  PairedCharacterRecord,
} from "@/application/ports/CharacterStatsRepository";

type PrismaLike = PrismaClient | Prisma.TransactionClient;

export class PrismaCharacterStatsRepository implements CharacterStatsRepository {
  constructor(private readonly client: PrismaLike = prisma) {}

  async countPicksByCharacter(characterId: string): Promise<number> {
    return this.client.draftLog.count({ where: { characterId, action: "PICK" } });
  }

  async countBansByCharacter(characterId: string): Promise<number> {
    return this.client.draftLog.count({ where: { characterId, action: "BAN" } });
  }

  async countFinishedRooms(): Promise<number> {
    return this.client.room.count({ where: { status: "FINISHED" } });
  }

  async listRecentLogsForCharacter(characterId: string, limit: number): Promise<RecentMatchRecord[]> {
    const logs = await this.client.draftLog.findMany({
      where: { characterId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        room: {
          select: {
            code: true,
            bluePlayerName: true,
            redPlayerName: true,
            createdAt: true,
          },
        },
      },
    });
    return logs.map((log) => ({
      roomCode: log.room.code,
      action: log.action,
      player: log.player,
      bluePlayerName: log.room.bluePlayerName,
      redPlayerName: log.room.redPlayerName,
      date: log.room.createdAt,
    }));
  }

  async findPairedCharacters(characterId: string, limit: number): Promise<PairedCharacterRecord[]> {
    const rows = await this.client.$queryRaw<Array<{ characterId: string; count: bigint }>>`
      SELECT dl2."characterId", COUNT(*) as count
      FROM "DraftLog" dl1
      JOIN "DraftLog" dl2
        ON dl1."roomId" = dl2."roomId"
        AND dl1.player = dl2.player
        AND dl1.action = 'PICK'
        AND dl2.action = 'PICK'
        AND dl1."characterId" != dl2."characterId"
      WHERE dl1."characterId" = ${characterId}
      GROUP BY dl2."characterId"
      ORDER BY count DESC
      LIMIT ${limit}
    `;
    return rows.map((r) => ({ characterId: r.characterId, count: Number(r.count) }));
  }

  async aggregatePicksByCharacter(): Promise<CharacterStatsRecord[]> {
    const rows = await this.client.draftLog.groupBy({
      by: ["characterId"],
      where: { action: "PICK" },
      _count: { _all: true },
    });
    return rows.map((r) => ({ characterId: r.characterId, pickCount: r._count._all, banCount: 0 }));
  }

  async aggregateBansByCharacter(): Promise<CharacterStatsRecord[]> {
    const rows = await this.client.draftLog.groupBy({
      by: ["characterId"],
      where: { action: "BAN" },
      _count: { _all: true },
    });
    return rows.map((r) => ({ characterId: r.characterId, pickCount: 0, banCount: r._count._all }));
  }
}
