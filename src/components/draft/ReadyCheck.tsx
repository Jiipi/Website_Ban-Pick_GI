"use client";

import { playClickSound, playConfirmSound } from "@/lib/sounds";
import type { Session } from "@/lib/types";
import type { TeamSide } from "@/lib/types";

type ReadyCheckProps = {
  roomCode: string;
  session: Session | null;
  ownedTeam: TeamSide | null;
  blueReady: boolean;
  redReady: boolean;
  onReadyToggle: () => void;
};

export function ReadyCheck({
  roomCode: _roomCode,
  session: _session,
  ownedTeam,
  blueReady,
  redReady,
  onReadyToggle,
}: ReadyCheckProps) {
  const allReady = blueReady && redReady;

  const isCaptain = ownedTeam === "BLUE" || ownedTeam === "RED";
  const myReady = ownedTeam === "BLUE" ? blueReady : ownedTeam === "RED" ? redReady : false;

  function handleToggle() {
    if (myReady) {
      playClickSound();
    } else {
      playConfirmSound();
    }
    onReadyToggle();
  }

  return (
    <div className={`ready-check-panel${allReady ? " all-ready" : ""}`}>
      {/* Title */}
      <h3 className="ready-check-title">📋 Luật Draft</h3>

      {/* Rules summary */}
      <dl className="ready-check-rules">
        <dt>Format</dt>
        <dd>6 Bans / 16 Picks</dd>
        <dt>Timer</dt>
        <dd>30s mỗi lượt</dd>
        <dt>Bank</dt>
        <dd>2:00 dự trữ</dd>
      </dl>

      {/* Ready statuses */}
      <div className="ready-check-statuses">
        <div className={`ready-check-status team-blue${blueReady ? " is-ready" : ""}`}>
          <span className="ready-status-icon">{blueReady ? "✅" : "⏳"}</span>
          <span className="ready-status-label">🔵 Blue</span>
          <span className="ready-status-text">
            {blueReady ? "Sẵn sàng" : "Chờ xác nhận"}
          </span>
        </div>
        <div className={`ready-check-status team-red${redReady ? " is-ready" : ""}`}>
          <span className="ready-status-icon">{redReady ? "✅" : "⏳"}</span>
          <span className="ready-status-label">🔴 Red</span>
          <span className="ready-status-text">
            {redReady ? "Sẵn sàng" : "Chờ xác nhận"}
          </span>
        </div>
      </div>

      {/* Toggle button — only for captains */}
      {isCaptain && (
        <button
          className={`ready-btn${myReady ? " is-ready" : ""}`}
          onClick={handleToggle}
          type="button"
        >
          {myReady ? "❌ Huỷ sẵn sàng" : "✅ Tôi đã sẵn sàng"}
        </button>
      )}

      {/* Non-captain spectator message */}
      {!isCaptain && (
        <p style={{ margin: 0, textAlign: "center", color: "rgba(203,213,225,0.55)", fontSize: "0.7rem", fontWeight: 700 }}>
          Chờ 2 đội trưởng xác nhận sẵn sàng
        </p>
      )}
    </div>
  );
}
