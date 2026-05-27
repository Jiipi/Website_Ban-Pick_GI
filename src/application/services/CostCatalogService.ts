import type { BanPickRepository } from "@/application/ports/BanPickRepository";
import type { CharacterGateway } from "@/application/ports/CharacterGateway";
import type { CostCatalogRepository } from "@/application/ports/CostCatalogRepository";
import type { WeaponGateway } from "@/application/ports/WeaponGateway";
import { failure, success } from "@/application/shared/ServiceResult";
import { requireClientId } from "@/application/shared/payload";
import {
  createCostCatalogTemplate,
  normalizeCostCatalog,
} from "@/domain/cost/CostCatalog";

export class CostCatalogService {
  constructor(
    private readonly repository: BanPickRepository,
    private readonly costCatalogRepository: CostCatalogRepository,
    private readonly characterGateway: CharacterGateway,
    private readonly weaponGateway: WeaponGateway,
  ) {}

  async getCatalog() {
    const catalog = await this.costCatalogRepository.read();
    return success({ catalog });
  }

  async getTemplate() {
    const [characters, weapons] = await Promise.all([
      this.characterGateway.getCharacters(),
      this.weaponGateway.getWeapons(),
    ]);

    return success({
      catalog: createCostCatalogTemplate({ characters, weapons }),
    });
  }

  async importCatalog(payload: Record<string, unknown>) {
    const clientIdResult = requireClientId(payload);
    if (!clientIdResult.ok) return clientIdResult;

    const roomCode = String(payload.roomCode ?? "").trim().toUpperCase();
    if (!roomCode) {
      return failure(400, "Thiếu mã phòng để xác thực trọng tài");
    }

    const room = await this.repository.findRoomByCode(roomCode);
    if (!room) {
      return failure(404, "Room not found");
    }

    if (!room.hostClientId || room.hostClientId !== clientIdResult.data) {
      return failure(403, "Chỉ trọng tài mới được nhập file cost");
    }

    const catalogPayload = payload.catalog ?? payload;
    const catalog = normalizeCostCatalog(catalogPayload);
    const saved = await this.costCatalogRepository.write(catalog);

    await this.repository.updateRoom(room.id, { status: room.status });

    return success({
      catalog: saved,
      characterCount: Object.keys(saved.characters).length,
      weaponCount: Object.keys(saved.weapons).length,
    });
  }
}
