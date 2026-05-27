import { prisma } from "@/lib/prisma";
import type { SystemHealthRepository } from "@/application/ports/SystemHealthRepository";

export class PrismaSystemHealthRepository implements SystemHealthRepository {
  async pingDatabase(): Promise<{ ok: boolean; latencyMs: number; message: string }> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { ok: true, latencyMs: Date.now() - start, message: "Connected" };
    } catch (error) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        message: error instanceof Error ? error.message : "Database unreachable",
      };
    }
  }

  async countRooms(): Promise<{ total: number; active: number }> {
    const [total, active] = await Promise.all([
      prisma.room.count(),
      prisma.room.count({
        where: { status: { in: ["WAITING", "DRAFTING", "BUILDING"] } },
      }),
    ]);
    return { total, active };
  }

  async countTournaments(): Promise<number> {
    return prisma.tournament.count();
  }

  async countOnlinePlayers(): Promise<number> {
    return prisma.lobbyPlayer.count({ where: { status: "ONLINE" } });
  }

  async countUsers(): Promise<number> {
    return prisma.user.count();
  }
}
