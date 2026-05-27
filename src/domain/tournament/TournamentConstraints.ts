/**
 * Tournament constraint types and validation.
 * Enforced during build phase to ensure fair play.
 */

export type TournamentConstraints = {
  maxConstellation: number;       // 0–6, default 6 (no limit)
  maxWeaponRefinement: number;    // 1–5, default 5 (no limit)
  weaponRarityLimit: 4 | 5;      // max weapon rarity allowed
  forceF2PWeapon: boolean;        // only 4★ weapons
  bannedCharacterIds: string[];   // pre-banned from draft
  bannedWeaponIds: string[];      // cannot equip
  customLabel: string;            // display label e.g. "C2R1 Standard"
};

export type ConstraintViolation = {
  field: string;
  message: string;
};

export function getDefaultConstraints(): TournamentConstraints {
  return {
    maxConstellation: 6,
    maxWeaponRefinement: 5,
    weaponRarityLimit: 5,
    forceF2PWeapon: false,
    bannedCharacterIds: [],
    bannedWeaponIds: [],
    customLabel: "",
  };
}

export function normalizeConstraints(raw: unknown): TournamentConstraints {
  const defaults = getDefaultConstraints();
  if (!raw || typeof raw !== "object") return defaults;

  const obj = raw as Record<string, unknown>;
  return {
    maxConstellation: clampInt(obj.maxConstellation, 0, 6, defaults.maxConstellation),
    maxWeaponRefinement: clampInt(obj.maxWeaponRefinement, 1, 5, defaults.maxWeaponRefinement),
    weaponRarityLimit: obj.weaponRarityLimit === 4 ? 4 : 5,
    forceF2PWeapon: typeof obj.forceF2PWeapon === "boolean" ? obj.forceF2PWeapon : defaults.forceF2PWeapon,
    bannedCharacterIds: Array.isArray(obj.bannedCharacterIds)
      ? obj.bannedCharacterIds.filter((id): id is string => typeof id === "string")
      : [],
    bannedWeaponIds: Array.isArray(obj.bannedWeaponIds)
      ? obj.bannedWeaponIds.filter((id): id is string => typeof id === "string")
      : [],
    customLabel: typeof obj.customLabel === "string" ? obj.customLabel.trim().slice(0, 60) : "",
  };
}

type BuildInput = {
  characterId: string;
  consLevel: number;
  weaponRarity: number;
  weaponId?: string | null;
};

/**
 * Validate a single build against tournament constraints.
 * Returns empty array if valid, or list of violations.
 */
export function validateBuild(
  build: BuildInput,
  constraints: TournamentConstraints,
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];

  // Constellation limit
  if (build.consLevel > constraints.maxConstellation) {
    violations.push({
      field: "consLevel",
      message: `C${build.consLevel} vượt giới hạn (max C${constraints.maxConstellation})`,
    });
  }

  // Weapon rarity limit
  if (build.weaponRarity > constraints.weaponRarityLimit) {
    violations.push({
      field: "weaponRarity",
      message: `Vũ khí ${build.weaponRarity}★ không được phép (max ${constraints.weaponRarityLimit}★)`,
    });
  }

  // Force F2P weapon
  if (constraints.forceF2PWeapon && build.weaponRarity > 4) {
    violations.push({
      field: "weaponRarity",
      message: "Chỉ được dùng vũ khí 4★ (F2P)",
    });
  }

  // Banned weapon
  if (build.weaponId && constraints.bannedWeaponIds.includes(build.weaponId)) {
    violations.push({
      field: "weaponId",
      message: "Vũ khí này đã bị cấm",
    });
  }

  return violations;
}

/**
 * Check if a character is banned by tournament constraints.
 */
export function isCharacterBanned(characterId: string, constraints: TournamentConstraints): boolean {
  return constraints.bannedCharacterIds.includes(characterId);
}

/**
 * Get a human-readable summary of constraints.
 */
export function getConstraintSummary(constraints: TournamentConstraints): string {
  const parts: string[] = [];

  if (constraints.maxConstellation < 6) {
    parts.push(`C${constraints.maxConstellation} max`);
  }
  if (constraints.maxWeaponRefinement < 5) {
    parts.push(`R${constraints.maxWeaponRefinement} max`);
  }
  if (constraints.forceF2PWeapon || constraints.weaponRarityLimit === 4) {
    parts.push("4★ weapons only");
  }
  if (constraints.bannedCharacterIds.length > 0) {
    parts.push(`${constraints.bannedCharacterIds.length} banned chars`);
  }
  if (constraints.bannedWeaponIds.length > 0) {
    parts.push(`${constraints.bannedWeaponIds.length} banned weapons`);
  }

  return parts.length > 0 ? parts.join(" · ") : "No restrictions";
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}
