import type { DraftAction, TeamSide } from "@/domain/common/types";
import { resolveRoomTemplate, type DraftTemplate } from "./DraftTemplate";

export type Player = TeamSide;

export type DraftTurn = {
  turnNumber: number;
  phase: string;
  player: TeamSide;
  action: DraftAction;
  quantity: number;
};

export type DraftEntry = {
  id?: string | number;
  player: string;
  action: string;
  characterId: string;
  turnNumber: number;
  createdAt?: string | Date;
};

export type DraftValidation =
  | { ok: true; currentTurn: DraftTurn }
  | { ok: false; message: string };

/**
 * Convert a DraftTemplate into numbered DraftTurn[] array.
 * Automatically assigns phase labels based on action changes.
 */
export function templateToTurns(template: DraftTemplate): DraftTurn[] {
  const turns: DraftTurn[] = [];
  let phaseNum = 1;
  let prevAction: DraftAction | null = null;

  for (let i = 0; i < template.turns.length; i++) {
    const t = template.turns[i];
    if (prevAction !== null && prevAction !== t.action) phaseNum++;
    prevAction = t.action;
    turns.push({
      turnNumber: i + 1,
      phase: `Phase ${phaseNum}`,
      player: t.player,
      action: t.action,
      quantity: 1,
    });
  }

  return turns;
}

// ── Legacy hardcoded turns (backward-compat for rooms without template) ──
export const draftTurns: DraftTurn[] = [
  { turnNumber: 1, phase: "Phase 1", player: "BLUE", action: "BAN", quantity: 1 },
  { turnNumber: 2, phase: "Phase 1", player: "RED", action: "BAN", quantity: 1 },
  { turnNumber: 3, phase: "Phase 1", player: "BLUE", action: "BAN", quantity: 1 },
  { turnNumber: 4, phase: "Phase 1", player: "RED", action: "BAN", quantity: 1 },
  { turnNumber: 5, phase: "Phase 2", player: "BLUE", action: "PICK", quantity: 1 },
  { turnNumber: 6, phase: "Phase 2", player: "RED", action: "PICK", quantity: 1 },
  { turnNumber: 7, phase: "Phase 2", player: "RED", action: "PICK", quantity: 1 },
  { turnNumber: 8, phase: "Phase 2", player: "BLUE", action: "PICK", quantity: 1 },
  { turnNumber: 9, phase: "Phase 2", player: "BLUE", action: "PICK", quantity: 1 },
  { turnNumber: 10, phase: "Phase 2", player: "RED", action: "PICK", quantity: 1 },
  { turnNumber: 11, phase: "Phase 3", player: "RED", action: "BAN", quantity: 1 },
  { turnNumber: 12, phase: "Phase 3", player: "BLUE", action: "BAN", quantity: 1 },
  { turnNumber: 13, phase: "Phase 4", player: "RED", action: "PICK", quantity: 1 },
  { turnNumber: 14, phase: "Phase 4", player: "BLUE", action: "PICK", quantity: 1 },
  { turnNumber: 15, phase: "Phase 4", player: "BLUE", action: "PICK", quantity: 1 },
  { turnNumber: 16, phase: "Phase 4", player: "RED", action: "PICK", quantity: 1 },
  { turnNumber: 17, phase: "Phase 4", player: "RED", action: "PICK", quantity: 1 },
  { turnNumber: 18, phase: "Phase 4", player: "BLUE", action: "PICK", quantity: 1 },
  { turnNumber: 19, phase: "Phase 4", player: "BLUE", action: "PICK", quantity: 1 },
  { turnNumber: 20, phase: "Phase 4", player: "RED", action: "PICK", quantity: 1 },
  { turnNumber: 21, phase: "Phase 4", player: "RED", action: "PICK", quantity: 1 },
  { turnNumber: 22, phase: "Phase 4", player: "BLUE", action: "PICK", quantity: 1 },
];

export const LAST_TURN_NUMBER = draftTurns[draftTurns.length - 1].turnNumber;
export const SKIPPED_CHARACTER_ID = "SKIPPED";

export class DraftPolicy {
  /**
   * Resolve the turn list for a room.
   * Uses the room's draftTemplate if set, otherwise defaults.
   */
  resolveTurns(roomDraftTemplate: unknown): DraftTurn[] {
    if (!roomDraftTemplate) return draftTurns;
    const template = resolveRoomTemplate(roomDraftTemplate);
    return templateToTurns(template);
  }

  /**
   * Get current turn based on logs and the turn list.
   */
  getCurrentTurn(logs: DraftEntry[], turns?: DraftTurn[]): DraftTurn | null {
    const turnList = turns ?? draftTurns;
    for (const turn of turnList) {
      const count = logs.filter((log) => log.turnNumber === turn.turnNumber).length;
      if (count < turn.quantity) {
        return turn;
      }
    }
    return null;
  }

  isCharacterUnavailable(logs: DraftEntry[], characterId: string): boolean {
    return logs.some((log) => log.characterId !== SKIPPED_CHARACTER_ID && log.characterId === characterId);
  }

  getTeamPicks(logs: DraftEntry[], player: TeamSide, picksPerTeam?: number): DraftEntry[] {
    const limit = picksPerTeam ?? 8;
    return logs
      .filter((log) => log.player === player && log.action === "PICK" && log.characterId !== SKIPPED_CHARACTER_ID)
      .sort((a, b) => a.turnNumber - b.turnNumber)
      .slice(0, limit);
  }

  getLastTurnNumber(turns?: DraftTurn[]): number {
    const turnList = turns ?? draftTurns;
    return turnList[turnList.length - 1]?.turnNumber ?? LAST_TURN_NUMBER;
  }

  getPicksPerTeam(turns?: DraftTurn[]): number {
    const turnList = turns ?? draftTurns;
    return turnList.filter((t) => t.action === "PICK" && t.player === "BLUE").length;
  }

  validateDraftAction(input: {
    logs: DraftEntry[];
    player: TeamSide;
    action: DraftAction;
    characterIds: string[];
    turns?: DraftTurn[];
  }): DraftValidation {
    const turnList = input.turns ?? draftTurns;
    const currentTurn = this.getCurrentTurn(input.logs, turnList);

    if (!currentTurn) {
      return { ok: false, message: "Draft already complete" };
    }

    if (currentTurn.player !== input.player || currentTurn.action !== input.action) {
      return { ok: false, message: "Wrong player or action for current turn" };
    }

    if (input.characterIds.length !== 1) {
      return { ok: false, message: "Must select exactly 1 character" };
    }

    const picksPerTeam = this.getPicksPerTeam(turnList);
    if (input.action === "PICK" && this.getTeamPicks(input.logs, input.player, picksPerTeam).length >= picksPerTeam) {
      return { ok: false, message: `Cannot pick more than ${picksPerTeam} characters per team` };
    }

    if (input.characterIds.some((characterId) => this.isCharacterUnavailable(input.logs, characterId))) {
      return { ok: false, message: "Character already banned or picked" };
    }

    return { ok: true, currentTurn };
  }
}

export const draftPolicy = new DraftPolicy();
