"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isValidCostPerPoint, isValidName } from "@/lib/constants";
import { authFetch, getOrCreateClientId, setSession, syncClientIdCookie } from "@/lib/auth";
import { playClickSound, playConfirmSound, playErrorSound } from "@/lib/sounds";

type ResultActionsProps = {
  roomCode: string;
  hostClientId: string | null;
  hostName: string | null;
  costPerPoint: number;
  initialWinner: "BLUE" | "RED" | null;
};

export function ResultActions({ roomCode, hostClientId, hostName, costPerPoint, initialWinner }: ResultActionsProps) {
  const router = useRouter();
  const [isHost, setIsHost] = useState(false);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [recordingWinner, setRecordingWinner] = useState<"BLUE" | "RED" | null>(null);
  const [winner, setWinner] = useState<"BLUE" | "RED" | null>(initialWinner);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hostClientId) return;
    const me = getOrCreateClientId();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHost(me === hostClientId);
  }, [hostClientId]);

  async function createNewRoom() {
    if (!hostName || !isValidName(hostName)) {
      setError("Không có tên host để tạo phòng mới");
      playErrorSound();
      return;
    }
    setCreating(true);
    setError("");
    playClickSound();

    const cpp = isValidCostPerPoint(costPerPoint) ? costPerPoint : 10;
    const myClientId = getOrCreateClientId();

    const response = await authFetch("/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ costPerPoint: cpp, clientId: myClientId }),
    });
    const data = await response.json();
    setCreating(false);

    if (!response.ok) {
      setError(data.message ?? "Không tạo được phòng");
      playErrorSound();
      return;
    }

    setSession(data.room.code, {
      name: data.session.name,
      role: data.session.role,
      team: data.session.team,
    });
    await syncClientIdCookie(data.clientId ?? myClientId);
    playConfirmSound();
    router.push(`/room/${data.room.code}?cid=${encodeURIComponent(data.clientId ?? myClientId)}`);
  }

  async function resetBuilds() {
    setResetting(true);
    setError("");
    playClickSound();

    const myClientId = getOrCreateClientId();
    const response = await authFetch(`/api/room/${roomCode}/host`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: myClientId, action: "RESET_BUILDS" }),
    });

    setResetting(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.message ?? "Không chuyển về màn build được");
      playErrorSound();
      return;
    }

    playConfirmSound();
    router.push(`/room/${roomCode}/build?cid=${encodeURIComponent(myClientId)}`);
  }

  async function recordWinner(nextWinner: "BLUE" | "RED") {
    setRecordingWinner(nextWinner);
    setError("");
    playClickSound();

    const myClientId = getOrCreateClientId();
    const response = await authFetch(`/api/room/${roomCode}/host`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: myClientId, action: "RECORD_GAME_WINNER", winner: nextWinner }),
    });

    setRecordingWinner(null);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.message ?? "Không ghi nhận kết quả được");
      playErrorSound();
      return;
    }

    setWinner(nextWinner);
    playConfirmSound();
    router.refresh();
  }

  if (!isHost) return null;

  return (
    <>
      <button
        className="btn-gold flex items-center gap-2"
        disabled={creating}
        onClick={createNewRoom}
        type="button"
      >
        {creating ? "Đang tạo..." : "✨ Tạo trận mới"}
      </button>
      <Link href={`/room/${roomCode}?view=draft`} className="btn-outline">
        ↻ Quay lại phòng
      </Link>
      <button
        className="btn-outline"
        disabled={resetting}
        onClick={resetBuilds}
        type="button"
      >
        {resetting ? "Đang mở build..." : "Sửa/lưu lại build"}
      </button>
      {error && <p className="w-full text-xs text-red-300">⚠️ {error}</p>}
      <button
        className={winner === "BLUE" ? "btn-primary" : "btn-outline"}
        disabled={recordingWinner !== null}
        onClick={() => recordWinner("BLUE")}
        type="button"
      >
        {recordingWinner === "BLUE" ? "Đang lưu..." : winner === "BLUE" ? "Đã chọn Xanh thắng" : "Xanh thắng"}
      </button>
      <button
        className={winner === "RED" ? "btn-primary" : "btn-outline"}
        disabled={recordingWinner !== null}
        onClick={() => recordWinner("RED")}
        type="button"
      >
        {recordingWinner === "RED" ? "Đang lưu..." : winner === "RED" ? "Đã chọn Đỏ thắng" : "Đỏ thắng"}
      </button>
    </>
  );
}
