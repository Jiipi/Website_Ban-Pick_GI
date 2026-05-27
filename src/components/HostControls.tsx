"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { playClickSound, playConfirmSound, playErrorSound } from "@/lib/sounds";

type HostControlsProps = {
  roomCode: string;
  clientId: string;
  status: string;
  hasDraftLogs: boolean;
  hasBuilds: boolean;
  blueTaken: boolean;
  redTaken: boolean;
  blueReady?: boolean;
  redReady?: boolean;
};

export function HostControls({
  roomCode,
  clientId,
  status,
  hasDraftLogs,
  hasBuilds,
  blueTaken,
  redTaken,
  blueReady = false,
  redReady = false,
}: HostControlsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function call(action: string, extra?: Record<string, unknown>) {
    setBusy(action);
    setError("");
    playClickSound();

    const response = await fetch(`/api/room/${roomCode}/host`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, action, ...(extra ?? {}) }),
    });

    setBusy(null);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.message ?? "Hành động thất bại");
      playErrorSound();
      return;
    }

    playConfirmSound();
    router.refresh();
  }

  const canStart = status === "WAITING" && blueTaken && redTaken;
  const allReady = blueReady && redReady;
  const canStartFull = canStart && allReady;

  return (
    <div className="host-shared-actions">
      {/* Start Draft Button */}
      {status === "WAITING" && (
        <>
          <button
            className="host-start-btn"
            disabled={busy !== null || !canStartFull}
            onClick={() => call("START_DRAFT")}
            type="button"
          >
            {busy === "START_DRAFT" ? (
              <span className="host-btn-loading" />
            ) : canStartFull ? (
              <>⚡ Bắt Đầu Draft</>
            ) : canStart ? (
              <>⏳ Chờ cả 2 đội sẵn sàng</>
            ) : (
              <>⏳ Cần đủ 2 player</>
            )}
          </button>
          {canStart && (
            <div className="host-ready-row">
              <span className={`host-ready-indicator${blueReady ? " is-ready" : ""}`}>
                {blueReady ? "✅" : "⏳"} Blue
              </span>
              <span className={`host-ready-indicator${redReady ? " is-ready" : ""}`}>
                {redReady ? "✅" : "⏳"} Red
              </span>
              {!allReady && (
                <span className="host-ready-hint">Chờ cả 2 đội sẵn sàng</span>
              )}
            </div>
          )}
        </>
      )}

      {/* Management actions — horizontal */}
      <div className="host-management-row">
        <button
          className="host-mgmt-btn host-mgmt-amber"
          disabled={busy !== null || !hasDraftLogs}
          onClick={() => {
            if (confirm("Reset toàn bộ draft + build?")) call("RESET_DRAFT");
          }}
          type="button"
        >
          {busy === "RESET_DRAFT" ? "..." : "🔄 Reset Draft"}
        </button>
        <button
          className="host-mgmt-btn host-mgmt-amber"
          disabled={busy !== null || !hasBuilds}
          onClick={() => {
            if (confirm("Xoá toàn bộ build, giữ draft?")) call("RESET_BUILDS");
          }}
          type="button"
        >
          {busy === "RESET_BUILDS" ? "..." : "🛡 Reset Build"}
        </button>
        {(status === "DRAFTING" || status === "BUILDING") && (
          <button
            className="host-mgmt-btn host-mgmt-amber"
            disabled={busy !== null}
            onClick={() => call("PAUSE_MATCH", { reason: "TECHNICAL" })}
            type="button"
          >
            {busy === "PAUSE_MATCH" ? "..." : "⏸ Pause"}
          </button>
        )}
      </div>

      {error && (
        <p className="host-error">⚠️ {error}</p>
      )}
    </div>
  );
}
