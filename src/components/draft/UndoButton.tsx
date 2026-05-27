"use client";

import { useState, useEffect, useCallback } from "react";
import { Undo2 } from "lucide-react";
import { playClickSound } from "@/lib/sounds";

type UndoButtonProps = {
  roomCode: string;
  turnNumber: number;
  team: string;
  show: boolean;
  onRequest: () => void;
};

/**
 * Undo button that appears for 5 seconds after a turn is confirmed.
 * Clicking it sends an undo request to the opponent.
 */
export function UndoButton({ roomCode, turnNumber, team, show, onRequest }: UndoButtonProps) {
  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (show) {
      queueMicrotask(() => {
        if (cancelled) return;
        setVisible(true);
        setRequesting(false);
      });
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
    queueMicrotask(() => {
      if (!cancelled) setVisible(false);
    });
    return () => {
      cancelled = true;
    };
  }, [show, turnNumber]);

  const handleClick = useCallback(async () => {
    if (requesting) return;
    setRequesting(true);
    playClickSound();

    try {
      const res = await fetch("/api/draft/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode, action: "REQUEST", turnNumber, team }),
      });
      const data = await res.json();
      if (data.ok) {
        onRequest();
      }
    } catch {
      // silently fail
    } finally {
      setRequesting(false);
    }
  }, [roomCode, turnNumber, team, requesting, onRequest]);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="undo-request-btn"
      onClick={handleClick}
      disabled={requesting}
      title="Yêu cầu hoàn tác lượt vừa rồi"
    >
      <Undo2 size={14} />
      <span>{requesting ? "Đang gửi..." : "Undo"}</span>
    </button>
  );
}
