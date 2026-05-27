// Enka.Network client for Genshin Impact UID lookup AND character catalog source.
// Docs: https://api.enka.network/

export type EnkaElement = "Ice" | "Wind" | "Electric" | "Water" | "Fire" | "Rock" | "Grass" | "None";

export type EnkaCharacterMeta = {
  avatarId: string;
  rarity: 4 | 5;
  slug: string;             // matches genshin.jmp.blue slug shape
  name: string;             // English display name
  element: EnkaElement;
  sideIconName: string;     // e.g. UI_AvatarIcon_Side_Ayaka
  iconName: string;         // derived: UI_AvatarIcon_Ayaka
};

type EnkaCharactersJson = Record<string, {
  QualityType?: string;
  NameTextMapHash?: number | string;
  Element?: EnkaElement;
  SideIconName?: string;
  Costumes?: Record<string, unknown>;
  WeaponType?: string;
}>;

type EnkaLocJson = Record<string, Record<string, string>>;

let charactersCache: EnkaCharacterMeta[] | null = null;
let charactersByAvatarId: Record<string, EnkaCharacterMeta> | null = null;
let pfpsCache: Record<string, { iconPath: string }> | null = null;
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 0;

/** Force-clear the character cache so the next call re-fetches from Enka. */
export function resetCharacterCache(): void {
  charactersCache = null;
  charactersByAvatarId = null;
  pfpsCache = null;
  cacheLoadedAt = 0;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function deriveIconName(sideIconName: string): string {
  // SideIconName is "UI_AvatarIcon_Side_X" → portrait is "UI_AvatarIcon_X"
  return sideIconName.replace("_Side_", "_");
}

export async function loadCharacterMap(): Promise<{
  list: EnkaCharacterMeta[];
  byAvatarId: Record<string, EnkaCharacterMeta>;
  pfps: Record<string, { iconPath: string }>;
}> {
  const now = Date.now();
  if (charactersCache && charactersByAvatarId && pfpsCache && now - cacheLoadedAt < CACHE_TTL_MS) {
    return { list: charactersCache, byAvatarId: charactersByAvatarId, pfps: pfpsCache };
  }

  try {
    const headers = {
      "User-Agent": "BanPick-GI/1.0 (genshin-bp-tool)",
      Accept: "application/json",
    };
    const [charactersRes, locRes, pfpsRes] = await Promise.all([
      fetch("https://api.enka.network/store/characters.json", { headers, cache: "no-store" }),
      fetch("https://api.enka.network/store/loc.json", { headers, cache: "no-store" }),
      fetch("https://api.enka.network/store/pfps.json", { headers, cache: "no-store" }),
    ]);

    if (!charactersRes.ok || !locRes.ok) {
      return { list: charactersCache ?? [], byAvatarId: charactersByAvatarId ?? {}, pfps: pfpsCache ?? {} };
    }

    const characters = (await charactersRes.json()) as EnkaCharactersJson;
    const loc = (await locRes.json()) as EnkaLocJson;
    const en = loc.en ?? {};

    // Parse pfps
    if (pfpsRes.ok) {
      pfpsCache = (await pfpsRes.json()) as Record<string, { iconPath: string }>;
    } else {
      pfpsCache = pfpsCache ?? {};
    }

    const list: EnkaCharacterMeta[] = [];
    const byAvatarId: Record<string, EnkaCharacterMeta> = {};
    const seenSlugs = new Set<string>();

    for (const [avatarId, info] of Object.entries(characters)) {
      if (!info.NameTextMapHash || !info.QualityType || !info.SideIconName) continue;
      // Skip Traveler skill-depot variants (e.g. 10000005-502)
      if (avatarId.includes("-")) continue;
      // Skip trial / NPC / preview variants (avatarId ≥ 10000900)
      const numericId = Number(avatarId);
      if (Number.isFinite(numericId) && numericId >= 10000900) continue;

      const name = en[String(info.NameTextMapHash)];
      if (!name) continue;
      // Skip Traveler base (we add Anemo Traveler manually below)
      if (name === "Traveler") continue;
      // Skip any trial / preview entries that snuck through
      if (name.includes("(Trial)") || name.includes("(Test)")) continue;

      const rarity: 4 | 5 = info.QualityType === "QUALITY_ORANGE" || info.QualityType === "QUALITY_ORANGE_SP" ? 5 : 4;
      const element: EnkaElement = info.Element ?? "None";
      const slug = slugify(name);
      if (seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);

      const sideIconName = info.SideIconName;
      const iconName = deriveIconName(sideIconName);

      const meta: EnkaCharacterMeta = {
        avatarId,
        rarity,
        slug,
        name,
        element,
        sideIconName,
        iconName,
      };
      list.push(meta);
      byAvatarId[avatarId] = meta;
    }

    // Add Anemo Traveler manually so existing logs referencing "traveler-anemo" still work
    if (!seenSlugs.has("traveler-anemo")) {
      const traveler: EnkaCharacterMeta = {
        avatarId: "10000005-504",
        rarity: 5,
        slug: "traveler-anemo",
        name: "Traveler (Anemo)",
        element: "Wind",
        sideIconName: "UI_AvatarIcon_Side_PlayerBoy",
        iconName: "UI_AvatarIcon_PlayerBoy",
      };
      list.push(traveler);
    }

    list.sort((a, b) => a.name.localeCompare(b.name));

    charactersCache = list;
    charactersByAvatarId = byAvatarId;
    cacheLoadedAt = now;
    return { list, byAvatarId, pfps: pfpsCache ?? {} };
  } catch {
    return { list: charactersCache ?? [], byAvatarId: charactersByAvatarId ?? {}, pfps: pfpsCache ?? {} };
  }
}

export type EnkaShowcaseCharacter = {
  characterId: string;
  avatarId: number;
  rarity: number;
  consLevel: number;
  weaponRarity: number;
  weaponName?: string;
  level: number;
};

export type EnkaProfile = {
  uid: string;
  nickname: string;
  level: number;
  signature?: string;
  avatarUrl?: string;
  showcase: EnkaShowcaseCharacter[];
};

type EnkaApiResponse = {
  playerInfo?: {
    nickname?: string;
    level?: number;
    signature?: string;
    profilePicture?: { id?: number };
  };
  avatarInfoList?: Array<{
    avatarId?: number;
    talentIdList?: number[];
    propMap?: Record<string, { val?: string }>;
    equipList?: Array<{
      flat?: { itemType?: string; rankLevel?: number; nameTextMapHash?: string | number };
      weapon?: { level?: number };
    }>;
  }>;
};

export async function fetchEnkaProfile(uid: string): Promise<{ ok: true; profile: EnkaProfile } | { ok: false; status: number; message: string }> {
  if (!/^\d{9,10}$/.test(uid)) {
    return { ok: false, status: 400, message: "UID phải là 9-10 chữ số" };
  }

  let response: Response;
  try {
    response = await fetch(`https://enka.network/api/uid/${uid}`, {
      headers: {
        "User-Agent": "BanPick-GI/1.0 (genshin-bp-tool)",
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch {
    return { ok: false, status: 503, message: "Không kết nối được Enka.Network" };
  }

  if (response.status === 404) return { ok: false, status: 404, message: "Không tìm thấy UID" };
  if (response.status === 424) return { ok: false, status: 424, message: "Tài khoản không tồn tại hoặc bị ẩn" };
  if (response.status === 429) return { ok: false, status: 429, message: "Quá nhiều yêu cầu, thử lại sau ~1 phút" };
  if (response.status === 500 || response.status === 503) return { ok: false, status: 503, message: "Enka.Network tạm lỗi, thử lại sau" };
  if (!response.ok) return { ok: false, status: response.status, message: `Enka trả về lỗi ${response.status}` };

  const data = (await response.json()) as EnkaApiResponse;
  const { byAvatarId, pfps } = await loadCharacterMap();

  const showcase: EnkaShowcaseCharacter[] = [];
  for (const avatar of data.avatarInfoList ?? []) {
    if (!avatar.avatarId) continue;
    const meta = byAvatarId[String(avatar.avatarId)];
    if (!meta) continue;

    const weaponEntry = (avatar.equipList ?? []).find((e) => e.weapon !== undefined);
    const weaponRarity = weaponEntry?.flat?.rankLevel === 5 ? 5 : 4;
    const consLevel = avatar.talentIdList?.length ?? 0;
    const levelStr = avatar.propMap?.["4001"]?.val;
    const level = levelStr ? Number(levelStr) : 0;

    showcase.push({
      characterId: meta.slug,
      avatarId: avatar.avatarId,
      rarity: meta.rarity,
      consLevel: Math.min(6, Math.max(0, consLevel)),
      weaponRarity,
      level,
    });
  }

  // Resolve profile picture using pfps.json lookup
  const pfpId = data.playerInfo?.profilePicture?.id;
  let avatarUrl: string | undefined;

  if (pfpId) {
    const pfpEntry = pfps[String(pfpId)];
    if (pfpEntry?.iconPath) {
      avatarUrl = `https://enka.network/ui/${pfpEntry.iconPath}.png`;
    }
  }

  // Fallback: use first showcase character's icon
  if (!avatarUrl && showcase.length > 0) {
    const firstChar = byAvatarId[String(showcase[0].avatarId)];
    if (firstChar) {
      avatarUrl = `https://enka.network/ui/${firstChar.iconName}.png`;
    }
  }

  return {
    ok: true,
    profile: {
      uid,
      nickname: data.playerInfo?.nickname ?? `UID-${uid}`,
      level: data.playerInfo?.level ?? 0,
      signature: data.playerInfo?.signature,
      avatarUrl,
      showcase,
    },
  };
}
