import type { TeamSide } from "@/domain/common/types";

export type Handicap = {
  diff: number;
  seconds: number;
  penalizedTeam: TeamSide | "NONE";
};

export class CostPolicy {
  calculateCharacterCost(rarity: number, consLevel: number, weaponRarity: number): number {
    const characterCost = rarity === 5 ? 1 + consLevel : 0;
    const weaponCost = weaponRarity === 5 ? 1 : 0;
    return characterCost + weaponCost;
  }

  calculateHandicap(blueCost: number, redCost: number, costPerPoint: number): Handicap {
    const diff = Math.abs(blueCost - redCost);
    const penalizedTeam: TeamSide | "NONE" = blueCost === redCost ? "NONE" : blueCost > redCost ? "BLUE" : "RED";
    return {
      diff,
      seconds: diff * costPerPoint,
      penalizedTeam,
    };
  }
}

export const costPolicy = new CostPolicy();
