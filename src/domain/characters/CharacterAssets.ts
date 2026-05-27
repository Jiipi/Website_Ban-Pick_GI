export type CharacterElement = "Pyro" | "Hydro" | "Anemo" | "Electro" | "Dendro" | "Cryo" | "Geo" | "Physical";

export type GenshinCharacter = {
  id: string;
  name: string;
  element: CharacterElement;
  rarity: 4 | 5;
  sideIconUrl: string;
  iconUrl: string;
  chibiIconUrl: string;
};

export const ELEMENT_COLORS: Record<CharacterElement, string> = {
  Pyro: "#FF6555",
  Hydro: "#4CC2F1",
  Anemo: "#74C2A8",
  Electro: "#B08CD9",
  Dendro: "#A5C83B",
  Cryo: "#9FD6E3",
  Geo: "#F2B53C",
  Physical: "#C0C0C0",
};

export const ELEMENT_ICONS: Record<CharacterElement, string> = {
  Pyro: "đŸ”¥",
  Hydro: "đŸ’§",
  Anemo: "đŸŒªï¸",
  Electro: "â¡",
  Dendro: "đŸŒ¿",
  Cryo: "â„ï¸",
  Geo: "đŸª¨",
  Physical: "â”ï¸",
};

export const ALL_ELEMENTS: CharacterElement[] = [
  "Pyro",
  "Hydro",
  "Anemo",
  "Electro",
  "Dendro",
  "Cryo",
  "Geo",
];

export const ENKA_TO_DISPLAY: Record<string, CharacterElement> = {
  Fire: "Pyro",
  Water: "Hydro",
  Wind: "Anemo",
  Electric: "Electro",
  Grass: "Dendro",
  Ice: "Cryo",
  Rock: "Geo",
  None: "Physical",
};

const ENKA_UI_BASE = "https://enka.network/ui";
const CRYO_ICON_DATA_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3CradialGradient id='g' cx='50%25' cy='50%25' r='52%25'%3E%3Cstop offset='0%25' stop-color='%23ffffff'/%3E%3Cstop offset='55%25' stop-color='%239fe6ff'/%3E%3Cstop offset='100%25' stop-color='%234bbfe3'/%3E%3C/radialGradient%3E%3C/defs%3E%3Ccircle cx='32' cy='32' r='28' fill='%2308243a' fill-opacity='.18'/%3E%3Cg fill='none' stroke='url(%23g)' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M32 8v48M11 20l42 24M11 44l42-24'/%3E%3Cpath d='M23 13l9 8 9-8M23 51l9-8 9 8M13 29l12-4-2-12M51 35l-12 4 2 12M13 35l12 4-2 12M51 29l-12-4 2-12' stroke-width='3.5'/%3E%3C/g%3E%3Ccircle cx='32' cy='32' r='5' fill='url(%23g)'/%3E%3C/svg%3E";

export const ELEMENT_ICON_URLS: Partial<Record<CharacterElement, string>> = {
  Pyro: `${ENKA_UI_BASE}/UI_Buff_Element_Fire.png`,
  Hydro: `${ENKA_UI_BASE}/UI_Buff_Element_Water.png`,
  Anemo: `${ENKA_UI_BASE}/UI_Buff_Element_Wind.png`,
  Electro: `${ENKA_UI_BASE}/UI_Buff_Element_Electric.png`,
  Dendro: `${ENKA_UI_BASE}/UI_Buff_Element_Grass.png`,
  Cryo: CRYO_ICON_DATA_URI,
  Geo: `${ENKA_UI_BASE}/UI_Buff_Element_Rock.png`,
};

export function sideIconUrl(sideIconName: string): string {
  return `${ENKA_UI_BASE}/${sideIconName}.png`;
}

export function fullIconUrl(iconName: string): string {
  return `${ENKA_UI_BASE}/${iconName}.png`;
}

export function getCharacterIconUrl(characterId: string, variant: "side" | "full" = "side"): string {
  const guess = slugToInternalName(characterId);
  return variant === "side"
    ? `${ENKA_UI_BASE}/UI_AvatarIcon_Side_${guess}.png`
    : `${ENKA_UI_BASE}/UI_AvatarIcon_${guess}.png`;
}

export function getCharacterElement(): CharacterElement {
  return "Physical";
}

function slugToInternalName(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}
