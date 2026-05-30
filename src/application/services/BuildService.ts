import type { BanPickRepository } from "@/application/ports/BanPickRepository";
import type { CostCatalogRepository } from "@/application/ports/CostCatalogRepository";
import { failure, success } from "@/application/shared/ServiceResult";
import { requireClientId } from "@/application/shared/payload";
import { isTeamSide } from "@/domain/common/types";
import { calculateBuildCost, makeBuildCostSnapshot } from "@/domain/cost/CostCatalog";
import { draftPolicy } from "@/domain/draft/DraftPolicy";
import { normalizeConstraints, validateBuild as validateBuildConstraints } from "@/domain/tournament/TournamentConstraints";

type BuildPayload = {
  characterId?: unknown;
  rarity?: unknown;
  consLevel?: unknown;
  weaponRarity?: unknown;
  weaponRefinement?: unknown;
  weaponId?: unknown;
  weaponName?: unknown;
  weaponIconUrl?: unknown;
  weaponType?: unknown;
};

export class BuildService {
  constructor(
    private readonly repository: BanPickRepository,
    private readonly costCatalogRepository: CostCatalogRepository,
  ) {}

  async saveBuilds(payload: Record<string, unknown>) {
    const roomCode = String(payload.roomCode ?? "").toUpperCase();
    const clientIdResult = requireClientId(payload);
    if (!clientIdResult.ok) return clientIdResult;

    const player = payload.player;
    const builds: BuildPayload[] = Array.isArray(payload.builds) ? payload.builds : [];

    if (!roomCode || !isTeamSide(player) || builds.length === 0) {
      return failure(400, "Dữ liệu build không hợp lệ");
    }

    const room = await this.repository.findRoomWithLogsAndBuildsByCode(roomCode);
    if (!room) {
      return failure(404, "Không tìm thấy phòng");
    }

    if (room.status === "FINISHED") {
      return failure(400, "Trận đấu đã kết thúc");
    }

    if (room.status === "WAITING" || room.status === "DRAFTING") {
      return failure(400, "Phải hoàn tất draft trước");
    }

    const slotClientId = player === "BLUE" ? room.blueClientId : room.redClientId;
    if (!slotClientId || slotClientId !== clientIdResult.data) {
      return failure(403, `Bạn không phải ${player === "BLUE" ? "Đội Xanh" : "Đội Đỏ"}`);
    }

    const pickedIds = new Set(draftPolicy.getTeamPicks(room.logs, player).map((log) => log.characterId));

    for (const build of builds) {
      const characterId = String(build.characterId ?? "");
      const rarity = Number(build.rarity);
      const consLevel = Number(build.consLevel);
      const weaponRarity = Number(build.weaponRarity);

      if (!pickedIds.has(characterId)) {
        return failure(400, `Nhân vật ${characterId} không thuộc lượt pick của ${player === "BLUE" ? "Đội Xanh" : "Đội Đỏ"}`);
      }

      if (![4, 5].includes(rarity) || !Number.isInteger(consLevel) || consLevel < 0 || consLevel > 6 || ![4, 5].includes(weaponRarity)) {
        return failure(400, "Thông tin build không hợp lệ");
      }
    }

    // Tournament constraint validation
    const constraints = room.constraints ? normalizeConstraints(room.constraints) : null;
    if (constraints) {
      for (const build of builds) {
        const violations = validateBuildConstraints(
          {
            characterId: String(build.characterId ?? ""),
            consLevel: Number(build.consLevel),
            weaponRarity: Number(build.weaponRarity),
            weaponId: stringOrNull(build.weaponId, 120),
          },
          constraints,
        );
        if (violations.length > 0) {
          return failure(400, violations[0].message);
        }
      }
    }

    const costCatalog = await this.costCatalogRepository.read();
    const savedBuilds = await this.repository.withTransaction(async (tx) => {
      const saved = [];
      for (const build of builds) {
        const characterId = String(build.characterId);
        const rarity = Number(build.rarity);
        const consLevel = Number(build.consLevel);
        const weaponRarity = Number(build.weaponRarity);
        const weaponId = stringOrNull(build.weaponId, 120);
        const refinementRaw = Number(build.weaponRefinement);
        const weaponRefinement = weaponId
          ? Number.isInteger(refinementRaw) && refinementRaw >= 1 && refinementRaw <= 5
            ? refinementRaw
            : 1
          : null;
        const cost = calculateBuildCost(costCatalog, {
          characterId,
          characterRarity: rarity,
          consLevel,
          weaponId,
          weaponRarity,
          weaponRefinement,
        });
        const weaponSnapshot = {
          weaponId,
          weaponName: stringOrNull(build.weaponName, 120),
          weaponIconUrl: stringOrNull(build.weaponIconUrl, 500),
          weaponType: stringOrNull(build.weaponType, 40),
          weaponRefinement,
        };
        const snapshot = makeBuildCostSnapshot({ ...weaponSnapshot, cost });

        saved.push(await tx.upsertCharacterBuild({
          roomId: room.id,
          player,
          characterId,
          rarity,
          consLevel,
          weaponRarity,
          totalCost: Math.round(cost.totalCost),
          enkaSnapshot: snapshot,
        }));
      }

      return saved;
    });

    return success({ builds: savedBuilds });
  }
}

function stringOrNull(value: unknown, maxLength: number): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : null;
}
