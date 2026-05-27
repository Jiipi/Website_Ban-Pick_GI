/**
 * Extended character metadata: weapon type, region, and role tags.
 * This data supplements the core GenshinCharacter type from genshin.ts.
 */

export type WeaponType = "Sword" | "Claymore" | "Polearm" | "Catalyst" | "Bow";
export type Region = "Mondstadt" | "Liyue" | "Inazuma" | "Sumeru" | "Fontaine" | "Natlan" | "Snezhnaya" | "Khaenri'ah" | "Unknown";
export type RoleTag = "Main DPS" | "Sub DPS" | "Support" | "Healer" | "Shielder";

export type CharacterMeta = {
  weapon: WeaponType;
  region: Region;
  roles: RoleTag[];
};

export const ALL_WEAPONS: WeaponType[] = ["Sword", "Claymore", "Polearm", "Catalyst", "Bow"];
export const ALL_REGIONS: Region[] = ["Mondstadt", "Liyue", "Inazuma", "Sumeru", "Fontaine", "Natlan", "Snezhnaya"];

export const WEAPON_ICONS: Record<WeaponType, string> = {
  Sword: "⚔️",
  Claymore: "🗡️",
  Polearm: "🔱",
  Catalyst: "📖",
  Bow: "🏹",
};

export const REGION_ICONS: Record<Region, string> = {
  Mondstadt: "🏰",
  Liyue: "🏯",
  Inazuma: "⛩️",
  Sumeru: "🌴",
  Fontaine: "⚜️",
  Natlan: "🌋",
  Snezhnaya: "❄️",
  "Khaenri'ah": "⚙️",
  Unknown: "❓",
};

/**
 * Character metadata keyed by slug ID (matching GenshinCharacter.id).
 * Characters not in this map will use default values.
 */
const META: Record<string, CharacterMeta> = {
  // ── Mondstadt ──
  "albedo": { weapon: "Sword", region: "Mondstadt", roles: ["Sub DPS", "Support"] },
  "amber": { weapon: "Bow", region: "Mondstadt", roles: ["Support"] },
  "barbara": { weapon: "Catalyst", region: "Mondstadt", roles: ["Healer"] },
  "bennett": { weapon: "Sword", region: "Mondstadt", roles: ["Support", "Healer"] },
  "diluc": { weapon: "Claymore", region: "Mondstadt", roles: ["Main DPS"] },
  "diona": { weapon: "Bow", region: "Mondstadt", roles: ["Support", "Healer", "Shielder"] },
  "eula": { weapon: "Claymore", region: "Mondstadt", roles: ["Main DPS"] },
  "fischl": { weapon: "Bow", region: "Mondstadt", roles: ["Sub DPS", "Support"] },
  "jean": { weapon: "Sword", region: "Mondstadt", roles: ["Support", "Healer"] },
  "kaeya": { weapon: "Sword", region: "Mondstadt", roles: ["Sub DPS"] },
  "klee": { weapon: "Catalyst", region: "Mondstadt", roles: ["Main DPS"] },
  "lisa": { weapon: "Catalyst", region: "Mondstadt", roles: ["Sub DPS"] },
  "mika": { weapon: "Polearm", region: "Mondstadt", roles: ["Support", "Healer"] },
  "mona": { weapon: "Catalyst", region: "Mondstadt", roles: ["Sub DPS", "Support"] },
  "noelle": { weapon: "Claymore", region: "Mondstadt", roles: ["Main DPS", "Healer", "Shielder"] },
  "razor": { weapon: "Claymore", region: "Mondstadt", roles: ["Main DPS"] },
  "rosaria": { weapon: "Polearm", region: "Mondstadt", roles: ["Sub DPS", "Support"] },
  "sucrose": { weapon: "Catalyst", region: "Mondstadt", roles: ["Support"] },
  "venti": { weapon: "Bow", region: "Mondstadt", roles: ["Support"] },

  // ── Liyue ──
  "baizhu": { weapon: "Catalyst", region: "Liyue", roles: ["Support", "Healer", "Shielder"] },
  "beidou": { weapon: "Claymore", region: "Liyue", roles: ["Sub DPS"] },
  "chongyun": { weapon: "Claymore", region: "Liyue", roles: ["Sub DPS", "Support"] },
  "ganyu": { weapon: "Bow", region: "Liyue", roles: ["Main DPS", "Sub DPS"] },
  "gaming": { weapon: "Claymore", region: "Liyue", roles: ["Main DPS"] },
  "hu-tao": { weapon: "Polearm", region: "Liyue", roles: ["Main DPS"] },
  "keqing": { weapon: "Sword", region: "Liyue", roles: ["Main DPS"] },
  "ningguang": { weapon: "Catalyst", region: "Liyue", roles: ["Main DPS"] },
  "qiqi": { weapon: "Sword", region: "Liyue", roles: ["Healer"] },
  "shenhe": { weapon: "Polearm", region: "Liyue", roles: ["Support"] },
  "xiangling": { weapon: "Polearm", region: "Liyue", roles: ["Sub DPS"] },
  "xianyun": { weapon: "Catalyst", region: "Liyue", roles: ["Support", "Healer"] },
  "xiao": { weapon: "Polearm", region: "Liyue", roles: ["Main DPS"] },
  "xingqiu": { weapon: "Sword", region: "Liyue", roles: ["Sub DPS", "Support"] },
  "xinyan": { weapon: "Claymore", region: "Liyue", roles: ["Support", "Shielder"] },
  "yanfei": { weapon: "Catalyst", region: "Liyue", roles: ["Main DPS"] },
  "yelan": { weapon: "Bow", region: "Liyue", roles: ["Sub DPS"] },
  "yun-jin": { weapon: "Polearm", region: "Liyue", roles: ["Support"] },
  "zhongli": { weapon: "Polearm", region: "Liyue", roles: ["Support", "Shielder"] },

  // ── Inazuma ──
  "arataki-itto": { weapon: "Claymore", region: "Inazuma", roles: ["Main DPS"] },
  "gorou": { weapon: "Bow", region: "Inazuma", roles: ["Support"] },
  "kamisato-ayaka": { weapon: "Sword", region: "Inazuma", roles: ["Main DPS"] },
  "kamisato-ayato": { weapon: "Sword", region: "Inazuma", roles: ["Main DPS", "Sub DPS"] },
  "kirara": { weapon: "Sword", region: "Inazuma", roles: ["Support", "Shielder"] },
  "kujou-sara": { weapon: "Bow", region: "Inazuma", roles: ["Support"] },
  "kuki-shinobu": { weapon: "Sword", region: "Inazuma", roles: ["Support", "Healer"] },
  "raiden-shogun": { weapon: "Polearm", region: "Inazuma", roles: ["Main DPS", "Support"] },
  "sangonomiya-kokomi": { weapon: "Catalyst", region: "Inazuma", roles: ["Healer", "Support"] },
  "sayu": { weapon: "Claymore", region: "Inazuma", roles: ["Support", "Healer"] },
  "shikanoin-heizou": { weapon: "Catalyst", region: "Inazuma", roles: ["Main DPS"] },
  "thoma": { weapon: "Polearm", region: "Inazuma", roles: ["Support", "Shielder"] },
  "yae-miko": { weapon: "Catalyst", region: "Inazuma", roles: ["Sub DPS"] },
  "yoimiya": { weapon: "Bow", region: "Inazuma", roles: ["Main DPS"] },

  // ── Sumeru ──
  "alhaitham": { weapon: "Sword", region: "Sumeru", roles: ["Main DPS"] },
  "candace": { weapon: "Polearm", region: "Sumeru", roles: ["Support"] },
  "collei": { weapon: "Bow", region: "Sumeru", roles: ["Support"] },
  "cyno": { weapon: "Polearm", region: "Sumeru", roles: ["Main DPS"] },
  "dehya": { weapon: "Claymore", region: "Sumeru", roles: ["Main DPS", "Shielder"] },
  "dori": { weapon: "Claymore", region: "Sumeru", roles: ["Support", "Healer"] },
  "faruzan": { weapon: "Bow", region: "Sumeru", roles: ["Support"] },
  "kaveh": { weapon: "Claymore", region: "Sumeru", roles: ["Sub DPS"] },
  "layla": { weapon: "Sword", region: "Sumeru", roles: ["Support", "Shielder"] },
  "nahida": { weapon: "Catalyst", region: "Sumeru", roles: ["Support", "Sub DPS"] },
  "nilou": { weapon: "Sword", region: "Sumeru", roles: ["Main DPS", "Support"] },
  "sethos": { weapon: "Bow", region: "Sumeru", roles: ["Sub DPS"] },
  "tighnari": { weapon: "Bow", region: "Sumeru", roles: ["Main DPS"] },
  "wanderer": { weapon: "Catalyst", region: "Sumeru", roles: ["Main DPS"] },

  // ── Fontaine ──
  "arlecchino": { weapon: "Polearm", region: "Fontaine", roles: ["Main DPS"] },
  "charlotte": { weapon: "Catalyst", region: "Fontaine", roles: ["Healer", "Support"] },
  "chevreuse": { weapon: "Polearm", region: "Fontaine", roles: ["Support"] },
  "chiori": { weapon: "Sword", region: "Fontaine", roles: ["Sub DPS"] },
  "clorinde": { weapon: "Sword", region: "Fontaine", roles: ["Main DPS"] },
  "emilie": { weapon: "Polearm", region: "Fontaine", roles: ["Sub DPS", "Support"] },
  "freminet": { weapon: "Claymore", region: "Fontaine", roles: ["Main DPS"] },
  "furina": { weapon: "Sword", region: "Fontaine", roles: ["Support"] },
  "lynette": { weapon: "Sword", region: "Fontaine", roles: ["Support"] },
  "lyney": { weapon: "Bow", region: "Fontaine", roles: ["Main DPS"] },
  "navia": { weapon: "Claymore", region: "Fontaine", roles: ["Main DPS"] },
  "neuvillette": { weapon: "Catalyst", region: "Fontaine", roles: ["Main DPS"] },
  "sigewinne": { weapon: "Bow", region: "Fontaine", roles: ["Healer", "Support"] },
  "wriothesley": { weapon: "Catalyst", region: "Fontaine", roles: ["Main DPS"] },

  // ── Natlan ──
  "chasca": { weapon: "Bow", region: "Natlan", roles: ["Main DPS"] },
  "citlali": { weapon: "Catalyst", region: "Natlan", roles: ["Support", "Sub DPS"] },
  "iansan": { weapon: "Polearm", region: "Natlan", roles: ["Support"] },
  "kinich": { weapon: "Claymore", region: "Natlan", roles: ["Main DPS"] },
  "kachina": { weapon: "Polearm", region: "Natlan", roles: ["Support", "Shielder"] },
  "mavuika": { weapon: "Claymore", region: "Natlan", roles: ["Main DPS"] },
  "mualani": { weapon: "Catalyst", region: "Natlan", roles: ["Main DPS"] },
  "xilonen": { weapon: "Sword", region: "Natlan", roles: ["Support"] },
  "varesa": { weapon: "Catalyst", region: "Natlan", roles: ["Main DPS"] },
  "ororon": { weapon: "Bow", region: "Natlan", roles: ["Sub DPS", "Support"] },
  "lan-yan": { weapon: "Catalyst", region: "Natlan", roles: ["Support"] },

  // ── Snezhnaya ──
  "tartaglia": { weapon: "Bow", region: "Snezhnaya", roles: ["Main DPS"] },

  // ── Upcoming / Manual ──
  "columbina": { weapon: "Catalyst", region: "Snezhnaya", roles: ["Support"] },
  "varka": { weapon: "Claymore", region: "Mondstadt", roles: ["Main DPS", "Support"] },
};

const DEFAULT_META: CharacterMeta = {
  weapon: "Sword",
  region: "Unknown",
  roles: ["Support"],
};

/**
 * Get metadata for a character by slug ID.
 * Falls back to default values for unknown characters.
 */
export function getCharacterMeta(characterId: string): CharacterMeta {
  return META[characterId] ?? DEFAULT_META;
}

/**
 * Check if a character has a specific weapon type.
 */
export function hasWeapon(characterId: string, weapon: WeaponType): boolean {
  return getCharacterMeta(characterId).weapon === weapon;
}

/**
 * Check if a character is from a specific region.
 */
export function isFromRegion(characterId: string, region: Region): boolean {
  return getCharacterMeta(characterId).region === region;
}

/**
 * Check if a character has a specific role.
 */
export function hasRole(characterId: string, role: RoleTag): boolean {
  return getCharacterMeta(characterId).roles.includes(role);
}
