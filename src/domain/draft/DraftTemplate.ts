/**
 * Draft Template — configurable turn order.
 * Replaces hardcoded draftTurns with a JSON-driven template.
 */

import type { DraftAction, TeamSide } from "@/domain/common/types";

export type DraftTemplateTurn = {
  player: TeamSide;
  action: DraftAction;
};

export type DraftTemplate = {
  id: string;
  name: string;
  description: string;
  turns: DraftTemplateTurn[];
  bansPerTeam: number;
  picksPerTeam: number;
};

// ── Built-in Templates ──

const STANDARD_4BAN: DraftTemplate = {
  id: "standard-4ban",
  name: "Standard 4 Ban",
  description: "4 ban + 8 pick mỗi đội (22 turns) — format mặc định",
  bansPerTeam: 2,
  picksPerTeam: 8,
  turns: [
    // Phase 1: Bans
    { player: "BLUE", action: "BAN" },
    { player: "RED", action: "BAN" },
    { player: "BLUE", action: "BAN" },
    { player: "RED", action: "BAN" },
    // Phase 2: Picks
    { player: "BLUE", action: "PICK" },
    { player: "RED", action: "PICK" },
    { player: "RED", action: "PICK" },
    { player: "BLUE", action: "PICK" },
    { player: "BLUE", action: "PICK" },
    { player: "RED", action: "PICK" },
    // Phase 3: Bans
    { player: "RED", action: "BAN" },
    { player: "BLUE", action: "BAN" },
    // Phase 4: Picks
    { player: "RED", action: "PICK" },
    { player: "BLUE", action: "PICK" },
    { player: "BLUE", action: "PICK" },
    { player: "RED", action: "PICK" },
    { player: "RED", action: "PICK" },
    { player: "BLUE", action: "PICK" },
    { player: "BLUE", action: "PICK" },
    { player: "RED", action: "PICK" },
    { player: "RED", action: "PICK" },
    { player: "BLUE", action: "PICK" },
  ],
};

const SIX_BAN: DraftTemplate = {
  id: "6ban",
  name: "6 Ban",
  description: "6 ban + 8 pick mỗi đội (28 turns) — nhiều ban hơn",
  bansPerTeam: 3,
  picksPerTeam: 8,
  turns: [
    // Phase 1: 3 Bans each
    { player: "BLUE", action: "BAN" }, { player: "RED", action: "BAN" },
    { player: "BLUE", action: "BAN" }, { player: "RED", action: "BAN" },
    { player: "BLUE", action: "BAN" }, { player: "RED", action: "BAN" },
    // Phase 2: Picks
    { player: "BLUE", action: "PICK" }, { player: "RED", action: "PICK" },
    { player: "RED", action: "PICK" }, { player: "BLUE", action: "PICK" },
    { player: "BLUE", action: "PICK" }, { player: "RED", action: "PICK" },
    // Phase 3: 2 More Bans each (not counted in bansPerTeam for simplicity)
    { player: "RED", action: "BAN" }, { player: "BLUE", action: "BAN" },
    { player: "RED", action: "BAN" }, { player: "BLUE", action: "BAN" },
    // Phase 4: More Picks
    { player: "RED", action: "PICK" }, { player: "BLUE", action: "PICK" },
    { player: "BLUE", action: "PICK" }, { player: "RED", action: "PICK" },
    { player: "RED", action: "PICK" }, { player: "BLUE", action: "PICK" },
    { player: "BLUE", action: "PICK" }, { player: "RED", action: "PICK" },
    { player: "RED", action: "PICK" }, { player: "BLUE", action: "PICK" },
  ],
};

const TEN_BAN: DraftTemplate = {
  id: "10ban",
  name: "10 Ban",
  description: "10 ban + 8 pick mỗi đội (34 turns) — maximum bans",
  bansPerTeam: 5,
  picksPerTeam: 8,
  turns: [
    // Phase 1: 5 Bans each
    { player: "BLUE", action: "BAN" }, { player: "RED", action: "BAN" },
    { player: "BLUE", action: "BAN" }, { player: "RED", action: "BAN" },
    { player: "BLUE", action: "BAN" }, { player: "RED", action: "BAN" },
    { player: "BLUE", action: "BAN" }, { player: "RED", action: "BAN" },
    { player: "BLUE", action: "BAN" }, { player: "RED", action: "BAN" },
    // Phase 2: Picks (snake)
    { player: "BLUE", action: "PICK" }, { player: "RED", action: "PICK" },
    { player: "RED", action: "PICK" }, { player: "BLUE", action: "PICK" },
    { player: "BLUE", action: "PICK" }, { player: "RED", action: "PICK" },
    { player: "RED", action: "PICK" }, { player: "BLUE", action: "PICK" },
    { player: "BLUE", action: "PICK" }, { player: "RED", action: "PICK" },
    { player: "RED", action: "PICK" }, { player: "BLUE", action: "PICK" },
    { player: "BLUE", action: "PICK" }, { player: "RED", action: "PICK" },
    { player: "RED", action: "PICK" }, { player: "BLUE", action: "PICK" },
  ],
};

const ALL_PICK: DraftTemplate = {
  id: "all-pick",
  name: "All Pick",
  description: "0 ban, 8 pick mỗi đội (16 turns) — không cấm tướng",
  bansPerTeam: 0,
  picksPerTeam: 8,
  turns: [
    { player: "BLUE", action: "PICK" }, { player: "RED", action: "PICK" },
    { player: "RED", action: "PICK" }, { player: "BLUE", action: "PICK" },
    { player: "BLUE", action: "PICK" }, { player: "RED", action: "PICK" },
    { player: "RED", action: "PICK" }, { player: "BLUE", action: "PICK" },
    { player: "BLUE", action: "PICK" }, { player: "RED", action: "PICK" },
    { player: "RED", action: "PICK" }, { player: "BLUE", action: "PICK" },
    { player: "BLUE", action: "PICK" }, { player: "RED", action: "PICK" },
    { player: "RED", action: "PICK" }, { player: "BLUE", action: "PICK" },
  ],
};

const SNAKE_DRAFT: DraftTemplate = {
  id: "snake-draft",
  name: "Snake Draft",
  description: "0 ban, 8 pick snake order — alternating picks",
  bansPerTeam: 0,
  picksPerTeam: 8,
  turns: [
    { player: "BLUE", action: "PICK" },
    { player: "RED", action: "PICK" }, { player: "RED", action: "PICK" },
    { player: "BLUE", action: "PICK" }, { player: "BLUE", action: "PICK" },
    { player: "RED", action: "PICK" }, { player: "RED", action: "PICK" },
    { player: "BLUE", action: "PICK" }, { player: "BLUE", action: "PICK" },
    { player: "RED", action: "PICK" }, { player: "RED", action: "PICK" },
    { player: "BLUE", action: "PICK" }, { player: "BLUE", action: "PICK" },
    { player: "RED", action: "PICK" }, { player: "RED", action: "PICK" },
    { player: "BLUE", action: "PICK" },
  ],
};

export const DRAFT_TEMPLATES: Record<string, DraftTemplate> = {
  "standard-4ban": STANDARD_4BAN,
  "6ban": SIX_BAN,
  "10ban": TEN_BAN,
  "all-pick": ALL_PICK,
  "snake-draft": SNAKE_DRAFT,
};

export const DEFAULT_TEMPLATE_ID = "standard-4ban";

export function getAllTemplates(): DraftTemplate[] {
  return Object.values(DRAFT_TEMPLATES);
}

export function getTemplateById(id: string): DraftTemplate {
  return DRAFT_TEMPLATES[id] ?? STANDARD_4BAN;
}

/**
 * Resolve the draft template from a room's draftTemplate JSON.
 * Falls back to standard-4ban if not set.
 */
export function resolveRoomTemplate(draftTemplateJson: unknown): DraftTemplate {
  if (!draftTemplateJson || typeof draftTemplateJson !== "object") {
    return STANDARD_4BAN;
  }
  const obj = draftTemplateJson as Record<string, unknown>;
  const id = typeof obj.id === "string" ? obj.id : "";
  if (DRAFT_TEMPLATES[id]) return DRAFT_TEMPLATES[id];

  // Custom template from JSON
  if (Array.isArray(obj.turns) && obj.turns.length > 0) {
    const turns = obj.turns
      .filter((t): t is Record<string, unknown> => typeof t === "object" && t !== null)
      .map((t) => ({
        player: (t.player === "RED" ? "RED" : "BLUE") as TeamSide,
        action: (t.action === "PICK" ? "PICK" : "BAN") as DraftAction,
      }));
    const picksPerTeam = turns.filter((t) => t.action === "PICK" && t.player === "BLUE").length;
    const bansPerTeam = turns.filter((t) => t.action === "BAN" && t.player === "BLUE").length;
    return {
      id: "custom",
      name: typeof obj.name === "string" ? obj.name : "Custom",
      description: typeof obj.description === "string" ? obj.description : "",
      turns,
      picksPerTeam,
      bansPerTeam,
    };
  }

  return STANDARD_4BAN;
}

/**
 * Get picks per team from a template.
 */
export function getPicksPerTeam(template: DraftTemplate): number {
  return template.turns.filter((t) => t.action === "PICK" && t.player === "BLUE").length;
}
