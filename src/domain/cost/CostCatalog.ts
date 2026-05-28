export type CostCatalogDefaults = {
  character: {
    rarity4Base: number;
    rarity5Base: number;
    constellationCost: number;
  };
  weapon: {
    rarity4: number;
    rarity5: number;
  };
};

export type CostCatalogCharacterRule = {
  name?: string;
  rarity?: 4 | 5;
  element?: string;
  baseCost?: number;
  constellationCost?: number;
};

export type CostCatalogWeaponRule = {
  name?: string;
  type?: string;
  rarity?: 4 | 5;
  cost?: number;
};

export type CostCatalog = {
  version: 1;
  updatedAt?: string;
  defaults: CostCatalogDefaults;
  characters: Record<string, CostCatalogCharacterRule>;
  weapons: Record<string, CostCatalogWeaponRule>;
};

export type BuildCostInput = {
  characterId: string;
  characterRarity: number;
  consLevel: number;
  weaponId?: string | null;
  weaponRarity: number;
  weaponRefinement?: number | null;
};

export type BuildCostBreakdown = {
  characterBaseCost: number;
  constellationCost: number;
  weaponCost: number;
  totalCost: number;
};

export type CostCatalogTemplateCharacter = {
  id: string;
  name: string;
  rarity: 4 | 5;
  element?: string;
};

export type CostCatalogTemplateWeapon = {
  id: string;
  name: string;
  type: string;
  rarity: 4 | 5;
};

export const defaultCostCatalog: CostCatalog = {
  version: 1,
  defaults: {
    character: {
      rarity4Base: 0,
      rarity5Base: 1,
      constellationCost: 1,
    },
    weapon: {
      rarity4: 0,
      rarity5: 1,
    },
  },
  characters: {},
  weapons: {},
};

export function createCostCatalogTemplate(input: {
  characters: CostCatalogTemplateCharacter[];
  weapons: CostCatalogTemplateWeapon[];
}): CostCatalog {
  const characters = Object.fromEntries(
    input.characters.map((character) => [
      character.id,
      {
        name: character.name,
        rarity: character.rarity,
        element: character.element,
        baseCost: character.rarity === 5 ? defaultCostCatalog.defaults.character.rarity5Base : defaultCostCatalog.defaults.character.rarity4Base,
        constellationCost: character.rarity === 5 ? defaultCostCatalog.defaults.character.constellationCost : 0,
      },
    ]),
  );

  const weapons = Object.fromEntries(
    input.weapons.map((weapon) => [
      weapon.id,
      {
        name: weapon.name,
        type: weapon.type,
        rarity: weapon.rarity,
        cost: weapon.rarity === 5 ? defaultCostCatalog.defaults.weapon.rarity5 : defaultCostCatalog.defaults.weapon.rarity4,
      },
    ]),
  );

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    defaults: defaultCostCatalog.defaults,
    characters,
    weapons,
  };
}

export function normalizeCostCatalog(raw: unknown): CostCatalog {
  if (!isRecord(raw)) {
    return withCurrentTimestamp(defaultCostCatalog);
  }

  const defaults = normalizeDefaults(raw.defaults);
  return {
    version: 1,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
    defaults,
    characters: normalizeCharacterRules(raw.characters),
    weapons: normalizeWeaponRules(raw.weapons),
  };
}

export function calculateBuildCost(catalog: CostCatalog, input: BuildCostInput): BuildCostBreakdown {
  const characterRule = catalog.characters[input.characterId];
  const characterBaseCost = finiteNumber(
    characterRule?.baseCost,
    input.characterRarity === 5 ? catalog.defaults.character.rarity5Base : catalog.defaults.character.rarity4Base,
  );
  const defaultConstellationCost = input.characterRarity === 5 ? catalog.defaults.character.constellationCost : 0;
  const constellationUnitCost = finiteNumber(characterRule?.constellationCost, defaultConstellationCost);
  const constellationCost = input.consLevel * constellationUnitCost;

  const weaponRule = input.weaponId ? catalog.weapons[input.weaponId] : undefined;
  const baseWeaponCost = finiteNumber(
    weaponRule?.cost,
    input.weaponRarity === 5 ? catalog.defaults.weapon.rarity5 : catalog.defaults.weapon.rarity4,
  );
  const refinement = Number.isInteger(input.weaponRefinement) && (input.weaponRefinement as number) >= 1 && (input.weaponRefinement as number) <= 5
    ? (input.weaponRefinement as number)
    : 1;
  const refinementBonus = input.weaponId ? (refinement - 1) : 0;
  const weaponCost = baseWeaponCost + refinementBonus;

  return normalizeBreakdown({
    characterBaseCost,
    constellationCost,
    weaponCost,
    totalCost: characterBaseCost + constellationCost + weaponCost,
  });
}

export function makeBuildCostSnapshot(input: {
  weaponId: string | null;
  weaponName: string | null;
  weaponIconUrl: string | null;
  weaponType: string | null;
  weaponRefinement?: number | null;
  cost: BuildCostBreakdown;
}) {
  return {
    weaponId: input.weaponId,
    weaponName: input.weaponName,
    weaponIconUrl: input.weaponIconUrl,
    weaponType: input.weaponType,
    weaponRefinement: input.weaponRefinement ?? null,
    costVersion: 1,
    characterBaseCost: input.cost.characterBaseCost,
    constellationCost: input.cost.constellationCost,
    weaponCost: input.cost.weaponCost,
    totalCost: input.cost.totalCost,
  };
}

export function getWeaponIdFromSnapshot(snapshot: unknown): string | null {
  if (!isRecord(snapshot)) return null;
  return typeof snapshot.weaponId === "string" && snapshot.weaponId.trim() ? snapshot.weaponId : null;
}

export function getWeaponRefinementFromSnapshot(snapshot: unknown): number | null {
  if (!isRecord(snapshot)) return null;
  const value = Number(snapshot.weaponRefinement);
  return Number.isInteger(value) && value >= 1 && value <= 5 ? value : null;
}

export function getExactCostFromSnapshot(snapshot: unknown): number | null {
  if (!isRecord(snapshot)) return null;
  return typeof snapshot.totalCost === "number" && Number.isFinite(snapshot.totalCost) ? snapshot.totalCost : null;
}

function normalizeDefaults(value: unknown): CostCatalogDefaults {
  const defaults = defaultCostCatalog.defaults;
  if (!isRecord(value)) return defaults;

  const character = isRecord(value.character) ? value.character : {};
  const weapon = isRecord(value.weapon) ? value.weapon : {};

  return {
    character: {
      rarity4Base: finiteNumber(character.rarity4Base, defaults.character.rarity4Base),
      rarity5Base: finiteNumber(character.rarity5Base, defaults.character.rarity5Base),
      constellationCost: finiteNumber(character.constellationCost, defaults.character.constellationCost),
    },
    weapon: {
      rarity4: finiteNumber(weapon.rarity4, defaults.weapon.rarity4),
      rarity5: finiteNumber(weapon.rarity5, defaults.weapon.rarity5),
    },
  };
}

function normalizeCharacterRules(value: unknown): Record<string, CostCatalogCharacterRule> {
  return normalizeRuleMap(value, (rule) => {
    if (typeof rule === "number") return { baseCost: finiteNumber(rule, 0) };
    if (!isRecord(rule)) return {};
    return {
      name: stringOrUndefined(rule.name),
      rarity: normalizeRarity(rule.rarity),
      element: stringOrUndefined(rule.element),
      baseCost: numberOrUndefined(rule.baseCost),
      constellationCost: numberOrUndefined(rule.constellationCost),
    };
  });
}

function normalizeWeaponRules(value: unknown): Record<string, CostCatalogWeaponRule> {
  return normalizeRuleMap(value, (rule) => {
    if (typeof rule === "number") return { cost: finiteNumber(rule, 0) };
    if (!isRecord(rule)) return {};
    return {
      name: stringOrUndefined(rule.name),
      type: stringOrUndefined(rule.type),
      rarity: normalizeRarity(rule.rarity),
      cost: numberOrUndefined(rule.cost),
    };
  });
}

function normalizeRuleMap<T>(value: unknown, mapRule: (rule: unknown) => T): Record<string, T> {
  if (Array.isArray(value)) {
    return Object.fromEntries(
      value
        .filter(isRecord)
        .map((entry) => [typeof entry.id === "string" ? entry.id : "", mapRule(entry)])
        .filter(([id]) => id),
    );
  }

  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .filter(([id]) => Boolean(id.trim()))
      .map(([id, rule]) => [id, mapRule(rule)]),
  );
}

function normalizeBreakdown(cost: BuildCostBreakdown): BuildCostBreakdown {
  return {
    characterBaseCost: roundCost(cost.characterBaseCost),
    constellationCost: roundCost(cost.constellationCost),
    weaponCost: roundCost(cost.weaponCost),
    totalCost: roundCost(cost.totalCost),
  };
}

function withCurrentTimestamp(catalog: CostCatalog): CostCatalog {
  return { ...catalog, updatedAt: new Date().toISOString() };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeRarity(value: unknown): 4 | 5 | undefined {
  return value === 4 || value === 5 ? value : undefined;
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? roundCost(value) : undefined;
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? roundCost(value) : fallback;
}

function roundCost(value: number): number {
  return Number(value.toFixed(4));
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
