import type { BanPickRepository, RoomRecord, UserRecord } from "@/application/ports/BanPickRepository";
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

  async importCatalog(payload: Record<string, unknown>, user: UserRecord) {
    const clientIdResult = requireClientId(payload);
    if (!clientIdResult.ok) return clientIdResult;

    const isAdmin = user.role === "ADMIN";
    let room: RoomRecord | null = null;

    if (!isAdmin) {
      const roomCode = String(payload.roomCode ?? "").trim().toUpperCase();
      room = roomCode
        ? await this.repository.findRoomByCode(roomCode)
        : await this.repository.findWaitingRoomByHost(user.id, clientIdResult.data);

      if (!room) {
        return failure(403, "Only admin or a WAITING room host can update the system cost catalog");
      }

      const isRoomReferee = Boolean(
        room.hostUserId === user.id &&
        room.hostClientId === clientIdResult.data,
      );

      if (!isRoomReferee || room.status !== "WAITING") {
        return failure(403, "Cost catalog can only be updated before the draft starts");
      }
    }

    const catalogPayload = payload.catalog ?? payload;
    const catalog = normalizeCostCatalog(catalogPayload);
    const saved = await this.costCatalogRepository.write(catalog);

    if (room) {
      await this.repository.updateRoom(room.id, { status: room.status });
    }

    return success({
      catalog: saved,
      characterCount: Object.keys(saved.characters).length,
      weaponCount: Object.keys(saved.weapons).length,
    });
  }
}
