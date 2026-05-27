/**
 * Team composition analysis engine for Genshin Impact.
 * Analyzes a team of picked characters and returns warnings/insights.
 */

import { getCharacterElement, type CharacterElement } from "@/lib/genshin";
import { getCharacterMeta, type RoleTag } from "@/lib/characterMeta";

export type WarningSeverity = "error" | "warning" | "info";

export type TeamWarning = {
  type: string;
  severity: WarningSeverity;
  icon: string;
  message: string;
};

export type ElementCount = { element: CharacterElement; count: number };
export type RoleCount = { role: RoleTag; count: number };

export type TeamCompResult = {
  elements: ElementCount[];
  roles: RoleCount[];
  warnings: TeamWarning[];
};

const ALL_ROLE_TAGS: RoleTag[] = ["Main DPS", "Sub DPS", "Support", "Healer", "Shielder"];

const ELEMENT_EMOJI: Record<CharacterElement, string> = {
  Pyro: "🔥", Hydro: "💧", Anemo: "🌪️", Electro: "⚡",
  Dendro: "🌿", Cryo: "❄️", Geo: "🪨", Physical: "⚔️",
};

/**
 * Analyze a team composition and return element/role breakdown + warnings.
 */
export function analyzeTeamComp(characterIds: string[]): TeamCompResult {
  if (characterIds.length === 0) {
    return { elements: [], roles: [], warnings: [] };
  }

  // Count elements
  const elementMap = new Map<CharacterElement, number>();
  for (const id of characterIds) {
    const el = getCharacterElement(id);
    elementMap.set(el, (elementMap.get(el) ?? 0) + 1);
  }
  const elements: ElementCount[] = Array.from(elementMap.entries())
    .map(([element, count]) => ({ element, count }))
    .sort((a, b) => b.count - a.count);

  // Count roles
  const roleMap = new Map<RoleTag, number>();
  for (const id of characterIds) {
    const meta = getCharacterMeta(id);
    for (const role of meta.roles) {
      roleMap.set(role, (roleMap.get(role) ?? 0) + 1);
    }
  }
  const roles: RoleCount[] = ALL_ROLE_TAGS
    .filter((role) => roleMap.has(role))
    .map((role) => ({ role, count: roleMap.get(role)! }));

  // Generate warnings
  const warnings: TeamWarning[] = [];
  const teamElements = new Set(elementMap.keys());
  const healerCount = roleMap.get("Healer") ?? 0;
  const shielderCount = roleMap.get("Shielder") ?? 0;
  const mainDpsCount = roleMap.get("Main DPS") ?? 0;
  const subDpsCount = roleMap.get("Sub DPS") ?? 0;

  // Only warn when team has 3+ picks (enough to evaluate comp)
  if (characterIds.length >= 3) {
    // Missing Healer
    if (healerCount === 0) {
      warnings.push({
        type: "missing_healer",
        severity: "warning",
        icon: "💊",
        message: "Thiếu Healer",
      });
    }

    // Missing Shielder
    if (shielderCount === 0) {
      warnings.push({
        type: "missing_shielder",
        severity: "info",
        icon: "🛡️",
        message: "Không có Shield",
      });
    }

    // Missing Off-field DPS
    if (subDpsCount === 0) {
      warnings.push({
        type: "missing_subdps",
        severity: "warning",
        icon: "🎯",
        message: "Thiếu Off-field DPS",
      });
    }

    // Too many Main DPS (field time conflict)
    if (mainDpsCount >= 3) {
      warnings.push({
        type: "excess_main_dps",
        severity: "warning",
        icon: "⚔️",
        message: `${mainDpsCount} Main DPS — xung đột field time`,
      });
    }

    // Too many Healers
    if (healerCount >= 3) {
      warnings.push({
        type: "excess_healer",
        severity: "warning",
        icon: "💊",
        message: `${healerCount} Healer — thiếu DMG`,
      });
    }
  }

  // Element-specific warnings (4+ picks)
  if (characterIds.length >= 4) {
    // Too few unique elements
    if (teamElements.size === 1) {
      const el = [...teamElements][0];
      warnings.push({
        type: "mono_element",
        severity: "info",
        icon: ELEMENT_EMOJI[el] ?? "🔮",
        message: `Mono ${el} — dễ bị counter`,
      });
    }

    // Missing Hydro (important for reactions)
    if (!teamElements.has("Hydro") && teamElements.size >= 2) {
      const hasReactiveElement = teamElements.has("Pyro") || teamElements.has("Cryo") || teamElements.has("Dendro");
      if (hasReactiveElement) {
        warnings.push({
          type: "missing_hydro",
          severity: "info",
          icon: "💧",
          message: "Thiếu Hydro cho Vaporize/Freeze/Bloom",
        });
      }
    }

    // Has Dendro but no Electro/Hydro (poor Dendro synergy)
    if (teamElements.has("Dendro") && !teamElements.has("Electro") && !teamElements.has("Hydro")) {
      warnings.push({
        type: "poor_dendro_synergy",
        severity: "info",
        icon: "🌿",
        message: "Dendro cần Electro/Hydro để trigger reactions",
      });
    }
  }

  return { elements, roles, warnings };
}
