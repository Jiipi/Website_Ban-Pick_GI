import type { WeaponGateway } from "@/application/ports/WeaponGateway";
import { success } from "@/application/shared/ServiceResult";

export class WeaponCatalogService {
  constructor(private readonly weaponGateway: WeaponGateway) {}

  async listWeapons(input: { refresh: boolean } = { refresh: false }) {
    if (input.refresh) {
      this.weaponGateway.resetCache();
    }

    const weapons = await this.weaponGateway.getWeapons();
    return success({ count: weapons.length, weapons });
  }
}
