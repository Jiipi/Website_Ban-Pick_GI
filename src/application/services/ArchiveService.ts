import type { BanPickRepository } from "@/application/ports/BanPickRepository";
import type { CostCatalogRepository } from "@/application/ports/CostCatalogRepository";
import { success } from "@/application/shared/ServiceResult";
import { calculateBuildCost, getWeaponIdFromSnapshot } from "@/domain/cost/CostCatalog";

export type ArchiveFilters = {
  query?: string;
  character?: string;
  format?: string;
  sort?: "recent" | "cost" | "closest";
  limit?: number;
};

export type ArchiveEntry = {
  id: string;
  code: string;
  status: string;
  bluePlayerName: string | null;
  redPlayerName: string | null;
  blueTeamName: string | null;
  redTeamName: string | null;
  blueCost: number;
  redCost: number;
  winner: "BLUE" | "RED" | "DRAW" | null;
  pickCount: number;
  picks: string[];
  seriesFormat: string | null;
  createdAt: Date;
};

export class ArchiveService {
  constructor(
    private readonly repository: BanPickRepository,
    private readonly costCatalogRepository: CostCatalogRepository,
  ) {}

  async listPublicMatches(filters: ArchiveFilters) {
    const limit = Math.min(filters.limit ?? 50, 100);
    const rooms = await this.repository.listRecentRoomsWithLogsAndBuilds(limit);
    const costCatalog = await this.costCatalogRepository.read();

    let entries: ArchiveEntry[] = rooms
      .filter((room) => room.status === "FINISHED")
      .map((room) => {
        const blueBuilds = room.builds.filter((b) => b.player === "BLUE");
        const redBuilds = room.builds.filter((b) => b.player === "RED");
        const blueCost = blueBuilds.reduce(
          (sum, build) =>
            sum +
            calculateBuildCost(costCatalog, {
              characterId: build.characterId,
              characterRarity: build.rarity,
              consLevel: build.consLevel,
              weaponId: getWeaponIdFromSnapshot(build.enkaSnapshot),
              weaponRarity: build.weaponRarity,
            }).totalCost,
          0,
        );
        const redCost = redBuilds.reduce(
          (sum, build) =>
            sum +
            calculateBuildCost(costCatalog, {
              characterId: build.characterId,
              characterRarity: build.rarity,
              consLevel: build.consLevel,
              weaponId: getWeaponIdFromSnapshot(build.enkaSnapshot),
              weaponRarity: build.weaponRarity,
            }).totalCost,
          0,
        );

        let winner: "BLUE" | "RED" | "DRAW" | null = null;
        if (blueCost > 0 || redCost > 0) {
          winner = blueCost === redCost ? "DRAW" : blueCost > redCost ? "BLUE" : "RED";
        }

        const picks = room.logs
          .filter((l) => l.action === "PICK")
          .map((l) => l.characterId);

        return {
          id: room.id,
          code: room.code,
          status: room.status,
          bluePlayerName: room.bluePlayerName,
          redPlayerName: room.redPlayerName,
          blueTeamName: (room as Record<string, unknown>).blueTeamName as string | null ?? null,
          redTeamName: (room as Record<string, unknown>).redTeamName as string | null ?? null,
          blueCost,
          redCost,
          winner,
          pickCount: picks.length,
          picks,
          seriesFormat: room.seriesFormat,
          createdAt: room.createdAt,
        };
      });

    // Filter by query
    if (filters.query) {
      const q = filters.query.toLowerCase();
      entries = entries.filter(
        (e) =>
          e.code.toLowerCase().includes(q) ||
          e.bluePlayerName?.toLowerCase().includes(q) ||
          e.redPlayerName?.toLowerCase().includes(q) ||
          e.blueTeamName?.toLowerCase().includes(q) ||
          e.redTeamName?.toLowerCase().includes(q),
      );
    }

    // Filter by character
    if (filters.character) {
      const charId = filters.character.toLowerCase();
      entries = entries.filter((e) =>
        e.picks.some((p) => p.toLowerCase().includes(charId)),
      );
    }

    // Filter by format
    if (filters.format && filters.format !== "ALL") {
      entries = entries.filter((e) => e.seriesFormat === filters.format);
    }

    // Sort
    switch (filters.sort) {
      case "cost":
        entries.sort((a, b) => Math.max(b.blueCost, b.redCost) - Math.max(a.blueCost, a.redCost));
        break;
      case "closest":
        entries.sort(
          (a, b) => Math.abs(a.blueCost - a.redCost) - Math.abs(b.blueCost - b.redCost),
        );
        break;
      default: // recent
        entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    return success({ matches: entries.slice(0, limit) });
  }
}
