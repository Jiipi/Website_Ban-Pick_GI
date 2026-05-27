import { draftPolicy, type DraftEntry } from "@/domain/draft/DraftPolicy";
import type { DraftAction, TeamSide } from "@/domain/common/types";

export {
  draftTurns,
  LAST_TURN_NUMBER,
  SKIPPED_CHARACTER_ID,
  type DraftEntry,
  type DraftTurn,
  type DraftValidation,
  type Player,
} from "@/domain/draft/DraftPolicy";
export type { DraftAction, TeamSide } from "@/domain/common/types";

export function getCurrentTurn(logs: DraftEntry[]) {
  return draftPolicy.getCurrentTurn(logs);
}

export function isCharacterUnavailable(logs: DraftEntry[], characterId: string): boolean {
  return draftPolicy.isCharacterUnavailable(logs, characterId);
}

export function getTeamPicks(logs: DraftEntry[], player: TeamSide) {
  return draftPolicy.getTeamPicks(logs, player);
}

export function validateDraftAction(input: {
  logs: DraftEntry[];
  player: TeamSide;
  action: DraftAction;
  characterIds: string[];
}) {
  return draftPolicy.validateDraftAction(input);
}
