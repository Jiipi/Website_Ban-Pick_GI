/**
 * Series Policy — manages Best-of-X series state and Fearless Draft.
 */

import type { RoomRecord, DraftLogRecord } from "@/application/ports/BanPickRepository";
import type { TeamSide } from "@/domain/common/types";

export type SeriesFormat = "BO1" | "BO3" | "BO5" | "BO7";

const WINS_NEEDED: Record<SeriesFormat, number> = {
  BO1: 1,
  BO3: 2,
  BO5: 3,
  BO7: 4,
};

export function isSeriesFormat(value: unknown): value is SeriesFormat {
  return value === "BO1" || value === "BO3" || value === "BO5" || value === "BO7";
}

export type SeriesGame = {
  gameNumber: number;
  roomCode: string;
  roomId: string;
  status: string;
  winner: TeamSide | null;
};

export type SeriesState = {
  seriesId: string;
  format: SeriesFormat;
  games: SeriesGame[];
  blueWins: number;
  redWins: number;
  winsNeeded: number;
  isFinished: boolean;
  winner: TeamSide | null;
  nextGameNumber: number;
  shouldSwapSides: boolean;
  fearlessDraft: boolean;
};

/**
 * Derive series state from rooms that share the same seriesId.
 */
export function getSeriesState(rooms: RoomRecord[]): SeriesState | null {
  if (rooms.length === 0) return null;

  const sorted = [...rooms].sort((a, b) => (a.gameNumber ?? 0) - (b.gameNumber ?? 0));
  const firstRoom = sorted[0];
  const seriesId = firstRoom.seriesId;
  if (!seriesId) return null;

  const format: SeriesFormat = isSeriesFormat(firstRoom.seriesFormat)
    ? firstRoom.seriesFormat
    : "BO1";
  const winsNeeded = WINS_NEEDED[format];

  const games: SeriesGame[] = sorted.map((room) => ({
    gameNumber: room.gameNumber ?? 1,
    roomCode: room.code,
    roomId: room.id,
    status: room.status,
    winner: deriveGameWinner(room),
  }));

  let blueWins = 0;
  let redWins = 0;
  for (const game of games) {
    if (game.winner === "BLUE") blueWins++;
    if (game.winner === "RED") redWins++;
  }

  const isFinished = blueWins >= winsNeeded || redWins >= winsNeeded;
  const winner = blueWins >= winsNeeded ? "BLUE" : redWins >= winsNeeded ? "RED" : null;
  const nextGameNumber = games.length + 1;
  // Swap sides on even-numbered games (game 2, 4, 6)
  const shouldSwapSides = nextGameNumber % 2 === 0;

  return {
    seriesId,
    format,
    games,
    blueWins,
    redWins,
    winsNeeded,
    isFinished,
    winner,
    nextGameNumber,
    shouldSwapSides,
    fearlessDraft: firstRoom.fearlessDraft ?? false,
  };
}

/**
 * Derive the winner of a single game from its room status.
 * A game is "won" when status is FINISHED.
 * Winner detection: compare total build costs or use a dedicated winner field.
 * For simplicity, we don't determine who won here — that's the result page's job.
 * The series tracks wins when the host records a result.
 */
function deriveGameWinner(room: RoomRecord): TeamSide | null {
  // We check if there's a recorded winner in constraints
  if (room.constraints && typeof room.constraints === "object") {
    const c = room.constraints as Record<string, unknown>;
    if (c.gameWinner === "BLUE") return "BLUE";
    if (c.gameWinner === "RED") return "RED";
  }
  return null;
}

/**
 * Check if the next game can be started.
 */
export function canStartNextGame(state: SeriesState): boolean {
  if (state.isFinished) return false;
  // All previous games must be finished or have a recorded winner
  return state.games.every((g) => g.winner !== null);
}

/**
 * Get the sides for the next game (with swap logic).
 * Even-numbered games swap sides.
 */
export function getNextGameSides(gameNumber: number): {
  blueIsOriginalBlue: boolean;
} {
  return { blueIsOriginalBlue: gameNumber % 2 === 1 };
}

/**
 * Fearless Draft: collect all characters picked in previous games.
 * These characters are banned for the next game.
 * LCK format: only PICK actions count, not bans.
 */
export function getFearlessBannedCharacters(
  previousGamesLogs: DraftLogRecord[][],
): string[] {
  const banned = new Set<string>();
  for (const logs of previousGamesLogs) {
    for (const log of logs) {
      if (log.action === "PICK" && log.characterId !== "SKIPPED") {
        banned.add(log.characterId);
      }
    }
  }
  return Array.from(banned);
}

/**
 * Generate a unique series ID.
 */
export function generateSeriesId(): string {
  return `series-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
