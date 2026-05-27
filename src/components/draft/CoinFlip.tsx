"use client";

import { useState, useCallback, useEffect } from "react";
import { playConfirmSound, playClickSound } from "@/lib/sounds";

type CoinFlipProps = {
  onComplete: (winner: "BLUE" | "RED", choice: "PICK_FIRST" | "DEFER") => void;
  onCancel: () => void;
};

type Phase = "idle" | "spinning" | "landed" | "choosing";

export function CoinFlip({ onComplete, onCancel }: CoinFlipProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [winner, setWinner] = useState<"BLUE" | "RED" | null>(null);

  const startFlip = useCallback(() => {
    if (phase !== "idle") return;
    playClickSound();
    setPhase("spinning");

    // Determine result
    const result: "BLUE" | "RED" = Math.random() > 0.5 ? "BLUE" : "RED";
    setWinner(result);

    // After spin animation ends (~2.2s), land
    setTimeout(() => {
      setPhase("landed");
      playConfirmSound();
      // Short pause before showing choice
      setTimeout(() => {
        setPhase("choosing");
      }, 600);
    }, 2200);
  }, [phase]);

  // Auto-start on mount
  useEffect(() => {
    const timer = setTimeout(startFlip, 400);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChoice(choice: "PICK_FIRST" | "DEFER") {
    playConfirmSound();
    if (winner) {
      onComplete(winner, choice);
    }
  }

  // The final rotation: Blue = 0deg (front face), Red = 180deg (back face)
  // The spin does multiples of 360 then lands on the correct side
  // We use CSS custom property to set the final rotation
  const finalRotation = winner === "RED" ? "1980deg" : "2160deg"; // 5.5 or 6 full rotations

  return (
    <div className="coin-flip-overlay">
      {/* Cancel button */}
      <button className="coin-cancel-btn" onClick={onCancel} type="button">
        ✕ Đóng
      </button>

      {/* Title */}
      <h2 className="coin-flip-title">
        {phase === "idle" && "🪙 Tung Đồng Xu"}
        {phase === "spinning" && "🪙 Đang tung..."}
        {phase === "landed" && "🪙 Kết quả!"}
        {phase === "choosing" && "🪙 Chọn quyền ưu tiên"}
      </h2>

      {/* 3D Coin */}
      <div className="coin-container">
        <div
          className={`coin${phase === "spinning" ? " coin-spinning" : ""}${
            phase === "landed" || phase === "choosing"
              ? winner === "BLUE"
                ? " coin-landed-blue"
                : " coin-landed-red"
              : ""
          }`}
          style={
            phase === "spinning"
              ? ({ "--coin-final-rotation": finalRotation } as React.CSSProperties)
              : undefined
          }
        >
          {/* Front = Blue */}
          <div className="coin-face coin-face-blue">🔵</div>
          {/* Back = Red */}
          <div className="coin-face coin-face-red">🔴</div>
        </div>
      </div>

      {/* Result + choice */}
      {phase === "choosing" && winner && (
        <div className="coin-result">
          <p className={`coin-result-text winner-${winner.toLowerCase()}`}>
            {winner === "BLUE" ? "🔵 BLUE" : "🔴 RED"} thắng!
          </p>
          <p className="coin-result-sub">Chọn quyền ưu tiên cho đội {winner}</p>

          <div className="coin-choice-buttons">
            <button
              className="coin-choice-btn choice-pick-first"
              onClick={() => handleChoice("PICK_FIRST")}
              type="button"
            >
              ⚡ Pick First
            </button>
            <button
              className="coin-choice-btn choice-defer"
              onClick={() => handleChoice("DEFER")}
              type="button"
            >
              🔄 Pick Second (Defer)
            </button>
          </div>
        </div>
      )}

      {/* Idle — click to start (fallback) */}
      {phase === "idle" && (
        <button
          className="coin-choice-btn choice-pick-first"
          onClick={startFlip}
          type="button"
          style={{ marginTop: 16 }}
        >
          🪙 Tung đồng xu
        </button>
      )}
    </div>
  );
}
