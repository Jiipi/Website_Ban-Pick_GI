import type { WeaponGateway, WeaponListItem } from "@/application/ports/WeaponGateway";

type GenshinWeaponApiItem = {
  id?: string;
  name?: string;
  type?: string;
  rarity?: number;
};

const GENSHIN_API_BASE = "https://genshin.jmp.blue";
const CACHE_TTL_MS = 1000 * 60 * 60 * 12;

let weaponCache: WeaponListItem[] | null = null;
let weaponCacheLoadedAt = 0;

export class GenshinWeaponGateway implements WeaponGateway {
  async getWeapons(): Promise<WeaponListItem[]> {
    const now = Date.now();
    if (weaponCache && now - weaponCacheLoadedAt < CACHE_TTL_MS) {
      return weaponCache;
    }

    const response = await fetch(`${GENSHIN_API_BASE}/weapons/all`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      return weaponCache ?? [];
    }

    const payload = (await response.json()) as GenshinWeaponApiItem[];
    const weapons = payload
      .filter((weapon): weapon is { id: string; name: string; type: string; rarity: 4 | 5 } =>
        Boolean(weapon.id && weapon.name && weapon.type && (weapon.rarity === 4 || weapon.rarity === 5)),
      )
      .map((weapon) => ({
        id: weapon.id,
        name: weapon.name,
        type: weapon.type,
        rarity: weapon.rarity,
        iconUrl: `${GENSHIN_API_BASE}/weapons/${weapon.id}/icon`,
      }))
      .sort((a, b) => b.rarity - a.rarity || a.type.localeCompare(b.type) || a.name.localeCompare(b.name));

    weaponCache = weapons;
    weaponCacheLoadedAt = now;
    return weapons;
  }

  resetCache(): void {
    weaponCache = null;
    weaponCacheLoadedAt = 0;
  }
}
