/**
 * Pause Policy — manages match pause/resume and timer preservation.
 */

import type { RoomRecord } from "@/application/ports/BanPickRepository";

export type PauseReason = "DISPUTE" | "TECHNICAL" | "BREAK";

const VALID_PAUSE_REASONS = new Set<string>(["DISPUTE", "TECHNICAL", "BREAK"]);

export function isPauseReason(value: unknown): value is PauseReason {
  return typeof value === "string" && VALID_PAUSE_REASONS.has(value);
}

/**
 * Check if a room can be paused.
 * Only allow pausing during DRAFTING or BUILDING status.
 */
export function canPause(room: RoomRecord): boolean {
  return (room.status === "DRAFTING" || room.status === "BUILDING") && !room.isPaused;
}

/**
 * Check if a room can be unpaused.
 */
export function canUnpause(room: RoomRecord): boolean {
  return room.isPaused;
}

/**
 * Calculate the room update data to pause a match.
 * Stores the current time as pausedAt.
 */
export function pauseRoom(reason: PauseReason): {
  isPaused: boolean;
  pausedAt: Date;
  pauseReason: string;
} {
  return {
    isPaused: true,
    pausedAt: new Date(),
    pauseReason: reason,
  };
}

/**
 * Calculate the room update data to unpause a match.
 * Adjusts lastTurnStartedAt forward by the paused duration
 * so the turn timer effectively "freezes" during pause.
 */
export function unpauseRoom(room: RoomRecord): {
  isPaused: boolean;
  pausedAt: null;
  pauseReason: null;
  lastTurnStartedAt: Date | null;
} {
  let adjustedTurnStart = room.lastTurnStartedAt;

  if (room.pausedAt && room.lastTurnStartedAt) {
    const pauseDurationMs = Date.now() - new Date(room.pausedAt).getTime();
    adjustedTurnStart = new Date(new Date(room.lastTurnStartedAt).getTime() + pauseDurationMs);
  }

  return {
    isPaused: false,
    pausedAt: null,
    pauseReason: null,
    lastTurnStartedAt: adjustedTurnStart,
  };
}

/**
 * Calculate how long the match has been paused (in seconds).
 */
export function getPauseDurationSeconds(room: RoomRecord): number {
  if (!room.isPaused || !room.pausedAt) return 0;
  return Math.floor((Date.now() - new Date(room.pausedAt).getTime()) / 1000);
}
