import { loadCharacterMap, slugify } from "./enka";

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
  Pyro: "🔥",
  Hydro: "💧",
  Anemo: "🌪️",
  Electro: "⚡",
  Dendro: "🌿",
  Cryo: "❄️",
  Geo: "🪨",
  Physical: "⚔️",
};

export const ALL_ELEMENTS: CharacterElement[] = [
  "Pyro", "Hydro", "Anemo", "Electro", "Dendro", "Cryo", "Geo",
];

const ENKA_TO_DISPLAY: Record<string, CharacterElement> = {
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

function proxiedChibiUrl(remoteUrl: string): string {
  return `/api/chibi?src=${encodeURIComponent(remoteUrl)}`;
}

function chibiPlaceholderUrl(name: string): string {
  return `/api/chibi?name=${encodeURIComponent(name)}`;
}

type ManualCharacter = {
  name: string;
  element: CharacterElement;
  rarity: 4 | 5;
};

const MANUAL_CHARACTERS: ManualCharacter[] = [
  { name: "Columbina", element: "Hydro", rarity: 5 },
  { name: "Illuga", element: "Geo", rarity: 4 },
  { name: "Linnea", element: "Geo", rarity: 5 },
  { name: "Varka", element: "Anemo", rarity: 5 },
  { name: "Wonderland Manekin", element: "Physical", rarity: 5 },
  { name: "Zibai", element: "Geo", rarity: 5 },
  { name: "Nicole", element: "Pyro", rarity: 5 },
  { name: "Prune", element: "Anemo", rarity: 4 },
  { name: "Lohen", element: "Cryo", rarity: 5 },
];

type FandomCategoryResponse = {
  continue?: { gcmcontinue?: string };
  query?: {
    pages?: Record<string, {
      title?: string;
      imageinfo?: Array<{ url?: string }>;
    }>;
  };
};

let chibiIconCache: Record<string, string> | null = null;
let chibiIconCacheLoadedAt = 0;

async function loadChibiIconIndex(): Promise<Record<string, string>> {
  const now = Date.now();
  if (chibiIconCache && now - chibiIconCacheLoadedAt < CACHE_TTL_MS) {
    return chibiIconCache;
  }

  try {
    const index: Record<string, { url: string; set: number; variant: number }> = {};
    let gcmcontinue: string | undefined;

    do {
      const params = new URLSearchParams({
        action: "query",
        format: "json",
        generator: "categorymembers",
        gcmtitle: "Category:Paimon's Paintings",
        gcmtype: "file",
        gcmlimit: "500",
        prop: "imageinfo",
        iiprop: "url",
      });
      if (gcmcontinue) params.set("gcmcontinue", gcmcontinue);

      const response = await fetch(`https://genshin-impact.fandom.com/api.php?${params}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) break;

      const data = (await response.json()) as FandomCategoryResponse;
      for (const page of Object.values(data.query?.pages ?? {})) {
        const title = page.title ?? "";
        const match = /^File:Icon Emoji Paimon's Paintings (\d+) (.+) (\d+)\.png$/.exec(title);
        if (!match) continue;

        const set = Number(match[1]);
        const name = match[2];
        const variant = Number(match[3]);
        const remoteUrl = page.imageinfo?.[0]?.url;
        if (!remoteUrl) continue;

        const slug = slugify(name);
        const current = index[slug];
        if (!current || set > current.set || (set === current.set && variant > current.variant)) {
          index[slug] = {
            url: proxiedChibiUrl(remoteUrl),
            set,
            variant,
          };
        }
      }

      gcmcontinue = data.continue?.gcmcontinue;
    } while (gcmcontinue);

    chibiIconCache = Object.fromEntries(Object.entries(index).map(([slug, entry]) => [slug, entry.url]));
    chibiIconCacheLoadedAt = now;
    return chibiIconCache;
  } catch {
    return chibiIconCache ?? {};
  }
}

let listCache: GenshinCharacter[] | null = null;
let bySlugCache: Record<string, GenshinCharacter> | null = null;
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 0;

export function resetGenshinCharacterCache(): void {
  listCache = null;
  bySlugCache = null;
  cacheLoadedAt = 0;
  chibiIconCache = null;
  chibiIconCacheLoadedAt = 0;
}

export async function getCharacters(): Promise<GenshinCharacter[]> {
  const now = Date.now();
  if (listCache && now - cacheLoadedAt < CACHE_TTL_MS) {
    return listCache;
  }

  const [{ list }, chibiIcons] = await Promise.all([loadCharacterMap(), loadChibiIconIndex()]);
  const transformed: GenshinCharacter[] = list.map((meta) => ({
    id: meta.slug,
    name: meta.name,
    element: ENKA_TO_DISPLAY[meta.element] ?? "Physical",
    rarity: meta.rarity,
    sideIconUrl: sideIconUrl(meta.sideIconName),
    iconUrl: fullIconUrl(meta.iconName),
    chibiIconUrl: chibiIcons[meta.slug] ?? chibiPlaceholderUrl(meta.name),
  }));

  const seenIds = new Set(transformed.map((character) => character.id));
  for (const manual of MANUAL_CHARACTERS) {
    const id = slugify(manual.name);
    if (seenIds.has(id)) continue;

    const iconUrl = chibiPlaceholderUrl(manual.name);
    transformed.push({
      id,
      name: manual.name,
      element: manual.element,
      rarity: manual.rarity,
      sideIconUrl: iconUrl,
      iconUrl,
      chibiIconUrl: chibiIcons[id] ?? iconUrl,
    });
    seenIds.add(id);
  }

  transformed.sort((a, b) => a.name.localeCompare(b.name));

  const bySlug: Record<string, GenshinCharacter> = {};
  for (const ch of transformed) bySlug[ch.id] = ch;

  listCache = transformed;
  bySlugCache = bySlug;
  cacheLoadedAt = now;
  return transformed;
}

export async function getCharacterMap(): Promise<Record<string, GenshinCharacter>> {
  if (bySlugCache && Date.now() - cacheLoadedAt < CACHE_TTL_MS) {
    return bySlugCache;
  }
  await getCharacters();
  return bySlugCache ?? {};
}

// Synchronous fallbacks for code paths that don't have a character object handy.
// They synthesize URLs from the slug — works only for characters whose internal
// name matches the title-cased slug (most do, but newer chars may not).
export function getCharacterIconUrl(characterId: string, variant: "side" | "full" = "side"): string {
  const cached = bySlugCache?.[characterId];
  if (cached) {
    return variant === "side" ? cached.sideIconUrl : cached.iconUrl;
  }
  const guess = slugToInternalName(characterId);
  return variant === "side"
    ? `${ENKA_UI_BASE}/UI_AvatarIcon_Side_${guess}.png`
    : `${ENKA_UI_BASE}/UI_AvatarIcon_${guess}.png`;
}

function slugToInternalName(slug: string): string {
  // Best-effort guess — title-case each segment, drop dashes
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export function getCharacterElement(id: string): CharacterElement {
  return bySlugCache?.[id]?.element ?? "Physical";
}

// Re-export for convenience
export { slugify };
