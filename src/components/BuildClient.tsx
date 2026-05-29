"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CostCalculator } from "@/components/CostCalculator";
import { authFetch, getSession } from "@/lib/auth";
import { PICKS_PER_TEAM } from "@/lib/constants";
import { canEditBuild } from "@/lib/permissions";
import type { Session, TeamSide } from "@/lib/types";
import { playClickSound, playConfirmSound, playErrorSound } from "@/lib/sounds";

type NamedPick = { characterId: string; name: string };

type BuildClientProps = {
  roomCode: string;
  bluePicks: NamedPick[];
  redPicks: NamedPick[];
  existingBuilds: Array<{ player: string; characterId: string; rarity: number; consLevel: number; weaponRarity: number; totalCost: number; source?: string }>;
  status: string;
  blueClientId: string | null;
  redClientId: string | null;
  hostClientId: string | null;
  blueUid: string | null;
  redUid: string | null;
  blueNickname: string | null;
  redNickname: string | null;
};

type BuildValue = { characterId: string; rarity: number; consLevel: number; weaponRarity: number; totalCost: number };

export function BuildClient({
  roomCode,
  bluePicks,
  redPicks,
  existingBuilds,
  status,
  blueClientId,
  redClientId,
  hostClientId,
  blueUid,
  redUid,
  blueNickname,
  redNickname,
}: BuildClientProps) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [tab, setTab] = useState<TeamSide>("BLUE");
  const [values, setValues] = useState<Record<string, BuildValue>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const next = getSession(roomCode);
      setSession(next);
      if (next?.team) {
        setTab(next.team);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [roomCode]);

  const room = useMemo(
    () => ({ hostClientId, blueClientId, redClientId, status }),
    [hostClientId, blueClientId, redClientId, status],
  );

  const picks = tab === "BLUE" ? bluePicks : redPicks;
  const teamUid = tab === "BLUE" ? blueUid : redUid;
  const teamNickname = tab === "BLUE" ? blueNickname : redNickname;
  const existingByCharacter = useMemo(
    () => new Map(existingBuilds.filter((build) => build.player === tab).map((build) => [build.characterId, build])),
    [existingBuilds, tab],
  );

  const totalCost = picks.reduce((sum, pick) => {
    const build = values[pick.characterId] ?? existingByCharacter.get(pick.characterId);
    return sum + (build?.totalCost ?? 1);
  }, 0);

  const canEdit = canEditBuild(room, session, tab);

  // Build progress
  const submittedCount = useMemo(
    () => existingBuilds.filter((b) => b.player === tab).length,
    [existingBuilds, tab],
  );
  const buildProgress = picks.length > 0 ? (submittedCount / picks.length) * 100 : 0;
  const hasNoBuilds = submittedCount === 0;

  function setBuild(value: BuildValue) {
    if (!canEdit) return;
    setValues((previous) => ({ ...previous, [value.characterId]: value }));
  }

  async function syncFromEnka() {
    if (!teamUid) {
      setSyncMsg("Đội này chưa khai báo UID lúc join");
      playErrorSound();
      return;
    }
    setSyncing(true);
    setSyncMsg("");
    setError("");

    const res = await fetch(`/api/enka?uid=${teamUid}`);
    const data = await res.json();
    setSyncing(false);

    if (!res.ok) {
      setSyncMsg(data.message ?? "Sync thất bại");
      playErrorSound();
      return;
    }

    const showcase = data.profile.showcase as Array<{ characterId: string; rarity: number; consLevel: number; weaponRarity: number }>;
    const byId = new Map(showcase.map((s) => [s.characterId, s]));

    let matched = 0;
    setValues((prev) => {
      const next = { ...prev };
      for (const pick of picks) {
        const enka = byId.get(pick.characterId);
        if (!enka) continue;
        const tCost = (enka.rarity === 5 ? 1 + enka.consLevel : 0) + (enka.weaponRarity === 5 ? 1 : 0);
        next[pick.characterId] = {
          characterId: pick.characterId,
          rarity: enka.rarity,
          consLevel: enka.consLevel,
          weaponRarity: enka.weaponRarity,
          totalCost: tCost,
        };
        matched += 1;
      }
      return next;
    });

    if (matched === 0) {
      setSyncMsg("Không có character nào trong Showcase trùng với picks. Đặt 8 nhân vật vào Showcase in-game rồi thử lại.");
      playErrorSound();
    } else {
      setSyncMsg(`✓ Đã sync ${matched}/${picks.length} character từ ${data.profile.nickname}`);
      playConfirmSound();
    }
  }

  async function submitBuilds() {
    if (!session || !canEdit) return;

    const builds = picks.map((pick) => values[pick.characterId] ?? existingByCharacter.get(pick.characterId) ?? { characterId: pick.characterId, rarity: 5, consLevel: 0, weaponRarity: 4, totalCost: 1 });
    setLoading(true);
    setError("");

    const response = await authFetch("/api/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomCode, clientId: session.clientId, player: tab, builds }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.message ?? "Không lưu được build");
      playErrorSound();
      return;
    }

    playConfirmSound();
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 animate-fade-in-up">
      {/* ── Header ── */}
      <div className="glass-strong flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/60 text-lg">🛡️</div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-400">Room {roomCode}</p>
            <h1 className="text-xl font-black uppercase tracking-wide text-slate-100">Nhập Cost Build</h1>
            {teamUid && (
              <p className="mt-0.5 text-[10px] text-emerald-300">
                ✓ {tab === "BLUE" ? "Blue" : "Red"} đã verify UID {teamUid}{teamNickname ? ` (${teamNickname})` : ""}
              </p>
            )}
            {!canEdit && (
              <p className="mt-0.5 text-[10px] text-slate-500">
                {!session ? "Chưa join phòng" : tab === session.team ? "" : `Bạn không phải ${tab === "BLUE" ? "Đội Xanh" : "Đội Đỏ"} — chỉ xem`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex overflow-hidden rounded-xl border border-slate-700/40" role="tablist" aria-label="Team selection">
            <button
              role="tab"
              aria-selected={tab === "BLUE"}
              className={`px-4 py-2 text-sm font-bold transition-all ${
                tab === "BLUE"
                  ? "bg-cyan-500/15 text-cyan-300 shadow-[inset_0_-2px_0_0_#22d3ee]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              onClick={() => { setTab("BLUE"); playClickSound(); setSyncMsg(""); }}
              type="button"
            >
              🔵 Đội Xanh
            </button>
            <button
              role="tab"
              aria-selected={tab === "RED"}
              className={`px-4 py-2 text-sm font-bold transition-all ${
                tab === "RED"
                  ? "bg-rose-500/15 text-rose-300 shadow-[inset_0_-2px_0_0_#fb7185]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              onClick={() => { setTab("RED"); playClickSound(); setSyncMsg(""); }}
              type="button"
            >
              🔴 Đội Đỏ
            </button>
          </div>

          <div className="rounded-xl bg-slate-950/60 px-4 py-2 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Cost</p>
            <p className="text-xl font-black tabular-nums text-cyan-300">{totalCost}</p>
          </div>
        </div>
      </div>

      {/* ── Build Progress ── */}
      <div className="glass rounded-xl p-3 flex items-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Progress: {submittedCount}/{picks.length}
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
            style={{ width: `${buildProgress}%` }}
          />
        </div>
        <span className="text-[10px] font-bold tabular-nums text-cyan-300">
          {Math.round(buildProgress)}%
        </span>
      </div>

      {/* ── Enka Sync ── */}
      {teamUid && canEdit && (
        <div className={`rounded-xl p-4 transition-all ${
          hasNoBuilds
            ? "border-2 border-cyan-500/40 bg-cyan-950/20 glow-cyan"
            : "glass"
        }`}>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${
              hasNoBuilds ? "text-cyan-300" : "text-emerald-300"
            }`}>
              {hasNoBuilds ? "⚡ Sync nhanh từ in-game" : "🔄 Enka.Network"}
            </span>
            <p className="text-[11px] flex-1 text-slate-400">
              {hasNoBuilds
                ? "Đặt 8 nhân vật vào Showcase trong game rồi bấm sync. Auto-fill cons, weapon trong 1 click!"
                : "Resync để cập nhật builds từ Showcase in-game."
              }
            </p>
            <button
              className={hasNoBuilds ? "btn-primary px-4 py-2 text-xs" : "btn-outline px-3 py-1.5 text-xs"}
              disabled={syncing}
              onClick={syncFromEnka}
              type="button"
            >
              {syncing ? "Đang sync..." : hasNoBuilds ? "Sync từ in-game" : "Resync"}
            </button>
          </div>
        </div>
      )}
      {syncMsg && (
        <p className={`rounded-xl px-3 py-2 text-xs ${
          syncMsg.startsWith("✓")
            ? "border border-emerald-700/40 bg-emerald-950/40 text-emerald-200"
            : "border border-amber-700/40 bg-amber-950/30 text-amber-200"
        }`}>
          {syncMsg}
        </p>
      )}

      {/* ── Build List ── */}
      <div className="space-y-2.5">
        {picks.map((pick, index) => {
          const existing = existingByCharacter.get(pick.characterId);
          const liveValue = values[pick.characterId];
          const initial = liveValue ?? existing;
          return (
            <div key={`${tab}-${pick.characterId}-${liveValue ? `v${liveValue.rarity}-${liveValue.consLevel}-${liveValue.weaponRarity}` : "x"}`} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
              <CostCalculator
                characterId={pick.characterId}
                characterName={pick.name}
                initial={initial}
                onChange={setBuild}
              />
            </div>
          );
        })}
      </div>

      {error && (
        <p className="animate-scale-in rounded-xl border border-red-800/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          ⚠️ {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          className="btn-primary"
          disabled={loading || picks.length !== PICKS_PER_TEAM || !canEdit}
          onClick={submitBuilds}
          type="button"
        >
          {loading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
              Đang lưu...
            </>
          ) : !canEdit ? (
            session?.team && session.team !== tab ? `Bạn là ${session.team === "BLUE" ? "Đội Xanh" : "Đội Đỏ"}` : "Không có quyền sửa"
          ) : (
            `Lưu build ${tab === "BLUE" ? "Đội Xanh" : "Đội Đỏ"}`
          )}
        </button>
        <button
          className="btn-outline"
          onClick={() => { playClickSound(); router.push(`/room/${roomCode}/result`); }}
          type="button"
        >
          Xem kết quả →
        </button>
      </div>
    </div>
  );
}
