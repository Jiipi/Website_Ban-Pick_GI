import { costPolicy } from "@/domain/cost/CostPolicy";

export type { Handicap } from "@/domain/cost/CostPolicy";

export function calculateCharacterCost(rarity: number, consLevel: number, weaponRarity: number): number {
  return costPolicy.calculateCharacterCost(rarity, consLevel, weaponRarity);
}

export function calculateHandicap(blueCost: number, redCost: number, costPerPoint: number) {
  return costPolicy.calculateHandicap(blueCost, redCost, costPerPoint);
}
