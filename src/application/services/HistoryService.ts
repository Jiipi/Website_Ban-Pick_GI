import type { BanPickRepository } from "@/application/ports/BanPickRepository";
import type { CostCatalogRepository } from "@/application/ports/CostCatalogRepository";
import { failure, success } from "@/application/shared/ServiceResult";
import { calculateBuildCost, getWeaponIdFromSnapshot, getWeaponRefinementFromSnapshot } from "@/domain/cost/CostCatalog";

export class HistoryService {
  constructor(
    private readonly repository: BanPickRepository,
    private readonly costCatalogRepository: CostCatalogRepository,
  ) {}

  async listHistory(query: string) {
    const rooms = await this.repository.listRecentRoomsWithLogsAndBuilds(50);
    const costCatalog = await this.costCatalogRepository.read();
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = normalizedQuery
      ? rooms.filter(
          (room) =>
            room.code.toLowerCase().includes(normalizedQuery) ||
            room.bluePlayerName?.toLowerCase().includes(normalizedQuery) ||
            room.redPlayerName?.toLowerCase().includes(normalizedQuery) ||
            room.hostName?.toLowerCase().includes(normalizedQuery),
        )
      : rooms;

    const history = filtered.map((room) => {
      const blueBuilds = room.builds.filter((build) => build.player === "BLUE");
      const redBuilds = room.builds.filter((build) => build.player === "RED");
      const blueCost = blueBuilds.reduce((sum, build) => sum + calculateBuildCost(costCatalog, {
        characterId: build.characterId,
        characterRarity: build.rarity,
        consLevel: build.consLevel,
        weaponId: getWeaponIdFromSnapshot(build.enkaSnapshot),
        weaponRarity: build.weaponRarity,
        weaponRefinement: getWeaponRefinementFromSnapshot(build.enkaSnapshot),
      }).totalCost, 0);
      const redCost = redBuilds.reduce((sum, build) => sum + calculateBuildCost(costCatalog, {
        characterId: build.characterId,
        characterRarity: build.rarity,
        consLevel: build.consLevel,
        weaponId: getWeaponIdFromSnapshot(build.enkaSnapshot),
        weaponRarity: build.weaponRarity,
        weaponRefinement: getWeaponRefinementFromSnapshot(build.enkaSnapshot),
      }).totalCost, 0);

      let winner: "BLUE" | "RED" | "DRAW" | null = null;
      if (blueCost > 0 || redCost > 0) {
        winner = blueCost === redCost ? "DRAW" : blueCost > redCost ? "BLUE" : "RED";
      }

      return {
        id: room.id,
        code: room.code,
        status: room.status,
        costPerPoint: room.costPerPoint,
        hostName: room.hostName,
        bluePlayerName: room.bluePlayerName,
        redPlayerName: room.redPlayerName,
        blueCost,
        redCost,
        winner,
        pickCount: room.logs.filter((log) => log.action === "PICK").length,
        createdAt: room.createdAt,
      };
    });

    return success({ history });
  }

  async deleteHistory(id: string | null, clientId: string) {
    if (!id) {
      return failure(400, "Missing id");
    }

    const room = await this.repository.findRoomById(id);
    if (!room) {
      return success({ ok: true });
    }

    if (room.hostClientId && room.hostClientId !== clientId) {
      return failure(403, "Chi host moi duoc xoa phong");
    }

    await this.repository.deleteRoomById(id).catch(() => null);
    return success({ ok: true });
  }
}
