"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { DraftEntry } from "@/lib/draft";
import { draftTurns } from "@/lib/draft";

type ReplayControlsProps = {
  allLogs: DraftEntry[];
  onTurnIndexChange: (index: number) => void;
};

const AUTO_PLAY_INTERVAL = 1500;

export function ReplayControls({ allLogs, onTurnIndexChange }: ReplayControlsProps) {
  const [turnIndex, setTurnIndex] = useState(allLogs.length);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalTurns = allLogs.length;

  const goTo = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(idx, totalTurns));
      setTurnIndex(clamped);
      onTurnIndexChange(clamped);
    },
    [totalTurns, onTurnIndexChange],
  );

  // Auto-play
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setTurnIndex((prev) => {
          const next = prev + 1;
          if (next > totalTurns) {
            setIsPlaying(false);
            return prev;
          }
          onTurnIndexChange(next);
          return next;
        });
      }, AUTO_PLAY_INTERVAL);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, totalTurns, onTurnIndexChange]);

  function handlePlay() {
    if (turnIndex >= totalTurns) {
      // Reset to start
      goTo(0);
      setTimeout(() => setIsPlaying(true), 100);
    } else {
      setIsPlaying(!isPlaying);
    }
  }

  // Current turn label
  const turnDef = turnIndex > 0 && turnIndex <= draftTurns.length ? draftTurns[turnIndex - 1] : null;
  const label = turnDef
    ? `Turn ${turnIndex}: ${turnDef.player} ${turnDef.action}`
    : turnIndex === 0
    ? "Start"
    : "End";

  return (
    <div className="replay-controls">
      <button className="replay-btn" onClick={() => goTo(0)} disabled={turnIndex === 0} type="button">
        ⏮
      </button>
      <button className="replay-btn" onClick={() => goTo(turnIndex - 1)} disabled={turnIndex === 0} type="button">
        ◀
      </button>
      <button className={`replay-btn ${isPlaying ? "is-active" : ""}`} onClick={handlePlay} type="button">
        {isPlaying ? "⏸" : "▶"}
      </button>
      <button className="replay-btn" onClick={() => goTo(turnIndex + 1)} disabled={turnIndex >= totalTurns} type="button">
        ▶
      </button>
      <button className="replay-btn" onClick={() => goTo(totalTurns)} disabled={turnIndex >= totalTurns} type="button">
        ⏭
      </button>

      <input
        type="range"
        className="replay-scrubber"
        min={0}
        max={totalTurns}
        value={turnIndex}
        onChange={(e) => {
          setIsPlaying(false);
          goTo(Number(e.target.value));
        }}
      />

      <span className="replay-label">{label}</span>
    </div>
  );
}
