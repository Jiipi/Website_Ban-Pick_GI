"use client";

import { getPauseDurationSeconds } from "@/domain/draft/PausePolicy";
import { useEffect, useState } from "react";

type PauseOverlayProps = {
  isPaused: boolean;
  pausedAt: string | null;
  pauseReason: string | null;
  isHost: boolean;
  roomCode: string;
  clientId: string;
};

const REASON_LABELS: Record<string, { icon: string; label: string }> = {
  DISPUTE: { icon: "⚖️", label: "Dispute — đang xử lý tranh chấp" },
  TECHNICAL: { icon: "🔧", label: "Technical — sự cố kỹ thuật" },
  BREAK: { icon: "☕", label: "Break — nghỉ giải lao" },
};

function formatPauseDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function PauseOverlay({
  isPaused,
  pausedAt,
  pauseReason,
  isHost,
  roomCode,
  clientId,
}: PauseOverlayProps) {
  const [elapsed, setElapsed] = useState(0);
  const [resuming, setResuming] = useState(false);

  useEffect(() => {
    if (!isPaused || !pausedAt) return;
    const start = new Date(pausedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, pausedAt]);

  if (!isPaused) return null;

  const reason = REASON_LABELS[pauseReason ?? ""] ?? REASON_LABELS.TECHNICAL;

  async function handleResume() {
    setResuming(true);
    try {
      await fetch(`/api/room/${roomCode}/host`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UNPAUSE_MATCH", clientId }),
      });
    } finally {
      setResuming(false);
    }
  }

  return (
    <div className="pause-overlay">
      <div className="pause-content">
        <div className="pause-icon">⏸️</div>
        <h2 className="pause-title">MATCH PAUSED</h2>
        <div className="pause-reason">
          <span>{reason.icon}</span>
          <span>{reason.label}</span>
        </div>
        <div className="pause-timer">{formatPauseDuration(elapsed)}</div>
        {isHost && (
          <button
            className="pause-resume-btn"
            onClick={handleResume}
            disabled={resuming}
            type="button"
          >
            {resuming ? "Đang resume..." : "▶ Resume Match"}
          </button>
        )}
        {!isHost && (
          <p className="pause-hint">Chờ host resume match...</p>
        )}
      </div>
    </div>
  );
}
