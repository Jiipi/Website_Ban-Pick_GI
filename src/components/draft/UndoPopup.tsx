"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, X } from "lucide-react";
import { playConfirmSound, playErrorSound } from "@/lib/sounds";

type UndoPopupProps = {
  roomCode: string;
  turnNumber: number;
  requestTeam: string;
  onRespond: (accepted: boolean) => void;
};

/**
 * Popup shown to the opponent when an undo request is received.
 * Auto-denies after 15 seconds if no response.
 */
export function UndoPopup({ roomCode, turnNumber, requestTeam, onRespond }: UndoPopupProps) {
  const [countdown, setCountdown] = useState(15);
  const [responding, setResponding] = useState(false);

  const handleRespond = useCallback(async (accept: boolean) => {
    if (responding) return;
    setResponding(true);

    if (accept) {
      playConfirmSound();
    } else {
      playErrorSound();
    }

    try {
      await fetch("/api/draft/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode,
          action: accept ? "APPROVE" : "DENY",
          turnNumber,
          requestTeam,
        }),
      });
    } catch {
      // silently fail
    }

    onRespond(accept);
  }, [roomCode, turnNumber, requestTeam, responding, onRespond]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRespond(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleRespond]);

  const teamLabel = requestTeam === "BLUE" ? "Đội Xanh" : "Đội Đỏ";
  const teamColor = requestTeam === "BLUE" ? "#38bdf8" : "#fb7185";

  return (
    <div className="undo-popup-overlay">
      <div className="undo-popup">
        <div className="undo-popup-icon">↩</div>
        <h3 className="undo-popup-title">Yêu cầu Undo</h3>
        <p className="undo-popup-message">
          <span style={{ color: teamColor, fontWeight: 900 }}>{teamLabel}</span> muốn hoàn tác lượt {turnNumber}.
        </p>
        <p className="undo-popup-message">Chấp nhận?</p>
        <div className="undo-popup-countdown">
          Tự động từ chối sau <strong>{countdown}s</strong>
        </div>
        <div className="undo-popup-actions">
          <button
            type="button"
            className="undo-popup-btn undo-popup-accept"
            onClick={() => handleRespond(true)}
            disabled={responding}
          >
            <Check size={16} />
            Chấp nhận
          </button>
          <button
            type="button"
            className="undo-popup-btn undo-popup-deny"
            onClick={() => handleRespond(false)}
            disabled={responding}
          >
            <X size={16} />
            Từ chối
          </button>
        </div>
      </div>
    </div>
  );
}
