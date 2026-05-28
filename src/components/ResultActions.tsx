"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isValidCostPerPoint, isValidName } from "@/lib/constants";
import { getOrCreateClientId, setSession, syncClientIdCookie } from "@/lib/auth";
import { playClickSound, playConfirmSound, playErrorSound } from "@/lib/sounds";

type ResultActionsProps = {
  roomCode: string;
  hostClientId: string | null;
  hostName: string | null;
  costPerPoint: number;
};

export function ResultActions({ roomCode, hostClientId, hostName, costPerPoint }: ResultActionsProps) {
  const router = useRouter();
  const [isHost, setIsHost] = useState(false);
  const [creating, setCreating] = useState(false);
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

    const response = await fetch("/api/room", {
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
      <Link href={`/room/${roomCode}`} className="btn-outline">
        ↻ Quay lại phòng
      </Link>
      {error && <p className="w-full text-xs text-red-300">⚠️ {error}</p>}
    </>
  );
}
