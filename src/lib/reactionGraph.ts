/**
 * Genshin Impact elemental reaction graph.
 * Pure data + utility functions for computing reaction synergies.
 */

import type { CharacterElement } from "@/lib/genshin";

export type ReactionTier = "S" | "A" | "B";

export type Reaction = {
  name: string;
  elements: [CharacterElement, CharacterElement];
  color: string;
  icon: string;
  tier: ReactionTier;
  description: string;
};

export const REACTIONS: Reaction[] = [
  // S-tier (meta-defining)
  { name: "Vaporize", elements: ["Hydro", "Pyro"], color: "#FF9E64", icon: "💨", tier: "S", description: "x2.0/x1.5 DMG multiplier" },
  { name: "Melt", elements: ["Pyro", "Cryo"], color: "#FF6B6B", icon: "🔥", tier: "S", description: "x2.0/x1.5 DMG multiplier" },
  { name: "Aggravate", elements: ["Electro", "Dendro"], color: "#C084FC", icon: "⚡", tier: "S", description: "Flat DMG bonus (Electro)" },
  { name: "Spread", elements: ["Dendro", "Electro"], color: "#86EFAC", icon: "🌿", tier: "S", description: "Flat DMG bonus (Dendro)" },
  { name: "Hyperbloom", elements: ["Dendro", "Hydro"], color: "#5EEAD4", icon: "🌱", tier: "S", description: "Dendro Core + Electro → homing" },

  // A-tier (strong)
  { name: "Freeze", elements: ["Hydro", "Cryo"], color: "#7DD3FC", icon: "❄️", tier: "A", description: "Immobilize enemies" },
  { name: "Bloom", elements: ["Hydro", "Dendro"], color: "#4ADE80", icon: "🌸", tier: "A", description: "Creates Dendro Cores" },
  { name: "Burgeon", elements: ["Dendro", "Pyro"], color: "#FB923C", icon: "🔥", tier: "A", description: "Dendro Core + Pyro → AoE" },
  { name: "Quicken", elements: ["Electro", "Dendro"], color: "#A78BFA", icon: "💜", tier: "A", description: "Enables Aggravate/Spread" },
  { name: "Superconduct", elements: ["Electro", "Cryo"], color: "#C4B5FD", icon: "💎", tier: "A", description: "Phys RES down 40%" },

  // B-tier (niche)
  { name: "Overloaded", elements: ["Pyro", "Electro"], color: "#F97316", icon: "💥", tier: "B", description: "AoE Pyro DMG + knockback" },
  { name: "Electro-Charged", elements: ["Hydro", "Electro"], color: "#818CF8", icon: "⚡", tier: "B", description: "Chain Electro DMG" },
  { name: "Swirl", elements: ["Anemo", "Pyro"], color: "#6EE7B7", icon: "🌪️", tier: "B", description: "Spreads + VV RES shred" },
  { name: "Crystallize", elements: ["Geo", "Pyro"], color: "#FCD34D", icon: "🪨", tier: "B", description: "Creates elemental shield" },
];

// Swirl and Crystallize work with ANY reactive element
const SWIRL_ELEMENTS: CharacterElement[] = ["Pyro", "Hydro", "Electro", "Cryo"];
const CRYSTALLIZE_ELEMENTS: CharacterElement[] = ["Pyro", "Hydro", "Electro", "Cryo"];

/**
 * Given a candidate element and the team's existing elements,
 * return all reactions the candidate could enable.
 */
export function getReactionsForCandidate(
  candidateElement: CharacterElement,
  teamElements: Set<CharacterElement>,
): Reaction[] {
  const results: Reaction[] = [];
  const seen = new Set<string>();

  // Special handling for Anemo (Swirl)
  if (candidateElement === "Anemo") {
    for (const el of SWIRL_ELEMENTS) {
      if (teamElements.has(el) && !seen.has("Swirl")) {
        results.push({
          name: "Swirl",
          elements: ["Anemo", el],
          color: "#6EE7B7",
          icon: "🌪️",
          tier: "B",
          description: `Swirl ${el} + VV RES shred`,
        });
        seen.add("Swirl");
      }
    }
    return results;
  }

  // Special handling for Geo (Crystallize)
  if (candidateElement === "Geo") {
    for (const el of CRYSTALLIZE_ELEMENTS) {
      if (teamElements.has(el) && !seen.has("Crystallize")) {
        results.push({
          name: "Crystallize",
          elements: ["Geo", el],
          color: "#FCD34D",
          icon: "🪨",
          tier: "B",
          description: `Crystallize ${el} shield`,
        });
        seen.add("Crystallize");
      }
    }
    return results;
  }

  // Check if team has Anemo → candidate triggers Swirl
  if (teamElements.has("Anemo") && SWIRL_ELEMENTS.includes(candidateElement)) {
    results.push({
      name: "Swirl",
      elements: ["Anemo", candidateElement],
      color: "#6EE7B7",
      icon: "🌪️",
      tier: "B",
      description: `Swirl ${candidateElement} + VV RES shred`,
    });
  }

  // Check if team has Geo → candidate triggers Crystallize
  if (teamElements.has("Geo") && CRYSTALLIZE_ELEMENTS.includes(candidateElement)) {
    results.push({
      name: "Crystallize",
      elements: ["Geo", candidateElement],
      color: "#FCD34D",
      icon: "🪨",
      tier: "B",
      description: `Crystallize ${candidateElement} shield`,
    });
  }

  // Standard reactions
  for (const reaction of REACTIONS) {
    if (seen.has(reaction.name)) continue;
    const [a, b] = reaction.elements;

    if (
      (candidateElement === a && teamElements.has(b)) ||
      (candidateElement === b && teamElements.has(a))
    ) {
      results.push(reaction);
      seen.add(reaction.name);
    }
  }

  // Sort by tier: S > A > B
  const tierOrder: Record<ReactionTier, number> = { S: 0, A: 1, B: 2 };
  results.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);

  return results;
}
