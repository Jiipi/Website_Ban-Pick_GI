export type WeaponListItem = {
  id: string;
  name: string;
  type: string;
  rarity: 4 | 5;
  iconUrl: string;
};

export interface WeaponGateway {
  getWeapons(): Promise<WeaponListItem[]>;
  resetCache(): void;
}
