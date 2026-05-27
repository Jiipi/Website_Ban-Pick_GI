/**
 * Cost rule presets — static JSON files loaded from data/presets/.
 */

import type { TournamentConstraints } from "@/domain/tournament/TournamentConstraints";
import { normalizeConstraints } from "@/domain/tournament/TournamentConstraints";

export type CostPreset = {
  id: string;
  name: string;
  description: string;
  costPerPoint: number;
  constraints: TournamentConstraints;
};

// Statically import all presets (works with Next.js bundling)
import standard36 from "../../data/presets/standard-36.json";
import f2p24 from "../../data/presets/f2p-24.json";
import whale50 from "../../data/presets/whale-50.json";
import c2r1Balanced from "../../data/presets/c2r1-balanced.json";

function parsePreset(raw: Record<string, unknown>): CostPreset {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    description: String(raw.description ?? ""),
    costPerPoint: Number(raw.costPerPoint ?? 10),
    constraints: normalizeConstraints(raw.constraints),
  };
}

const ALL_PRESETS: CostPreset[] = [
  parsePreset(c2r1Balanced as unknown as Record<string, unknown>),
  parsePreset(standard36 as unknown as Record<string, unknown>),
  parsePreset(f2p24 as unknown as Record<string, unknown>),
  parsePreset(whale50 as unknown as Record<string, unknown>),
];

/**
 * Get all available cost presets.
 */
export function getPresets(): CostPreset[] {
  return ALL_PRESETS;
}

/**
 * Find a preset by ID.
 */
export function getPresetById(id: string): CostPreset | undefined {
  return ALL_PRESETS.find((p) => p.id === id);
}
