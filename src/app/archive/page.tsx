"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";

type ArchiveMatch = {
  id: string;
  code: string;
  bluePlayerName: string | null;
  redPlayerName: string | null;
  blueTeamName: string | null;
  redTeamName: string | null;
  blueCost: number;
  redCost: number;
  winner: "BLUE" | "RED" | "DRAW" | null;
  pickCount: number;
  picks: string[];
  seriesFormat: string | null;
  createdAt: string;
};

const FORMATS = ["ALL", "BO1", "BO3", "BO5", "BO7"];
const SORTS = [
  { value: "recent", label: "Mới nhất", icon: "🕐" },
  { value: "cost", label: "Chi phí cao", icon: "💰" },
  { value: "closest", label: "Sát sao", icon: "⚖️" },
] as const;

export default function ArchivePage() {
  const [matches, setMatches] = useState<ArchiveMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [character, setCharacter] = useState("");
  const [format, setFormat] = useState("ALL");
  const [sort, setSort] = useState<"recent" | "cost" | "closest">("recent");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      if (character) params.set("character", character);
      if (format !== "ALL") params.set("format", format);
      params.set("sort", sort);
      params.set("limit", "50");

      const res = await fetch(`/api/archive?${params}`);
      const data = await res.json();
      setMatches(data.matches ?? []);
    } catch {
      setMatches([]);
    }
    setLoading(false);
  }, [query, character, format, sort]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-5">
          {/* Header */}
          <div className="glass-strong rounded-3xl px-6 py-5 animate-fade-in-up">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-2xl">
                  📚
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">
                    Genshin Impact
                  </p>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">
                    <span className="text-gradient-gold">Kho Trận Đấu</span>
                  </h1>
                </div>
              </div>
              <Link href="/" className="btn-outline shrink-0">
                ← Trang chủ
              </Link>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              Duyệt tất cả trận đã hoàn tất. Lọc theo tướng, định dạng giải, sắp xếp theo chi phí.
            </p>
          </div>

          {/* Filters */}
          <div className="glass-strong rounded-2xl px-5 py-4 animate-fade-in-up delay-100">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  🔍
                </span>
                <input
                  className="input-field pl-9 text-sm"
                  placeholder="Tìm mã phòng, tên người chơi..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              {/* Character filter */}
              <div className="relative min-w-[160px]">
                <input
                  className="input-field text-sm"
                  placeholder="🎭 Tên tướng..."
                  value={character}
                  onChange={(e) => setCharacter(e.target.value)}
                />
              </div>

              {/* Format */}
              <div className="flex gap-1">
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    className={`rounded-lg px-3 py-1.5 text-xs font-black transition-all ${
                      format === f
                        ? "bg-violet-500/15 text-violet-300 border border-violet-500/30"
                        : "text-slate-400 hover:text-slate-200 border border-transparent"
                    }`}
                    onClick={() => setFormat(f)}
                    type="button"
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div className="flex gap-1">
                {SORTS.map((s) => (
                  <button
                    key={s.value}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      sort === s.value
                        ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                        : "text-slate-400 hover:text-slate-200 border border-transparent"
                    }`}
                    onClick={() => setSort(s.value)}
                    type="button"
                  >
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2 text-xs font-bold text-slate-500">
              {matches.length} trận tìm thấy
            </div>
          </div>

          {/* Match list */}
          <div className="glass-strong rounded-2xl overflow-hidden animate-fade-in-up delay-200">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
              </div>
            ) : matches.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-4xl">📭</div>
                <p className="mt-3 font-bold text-slate-400">Không tìm thấy trận nào</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/40">
                {matches.map((m) => (
                  <Link
                    key={m.id}
                    href={`/room/${m.code}/result`}
                    className="group flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-slate-800/20"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="shrink-0 text-center">
                        <p className="font-mono text-sm font-black tracking-widest text-cyan-300 group-hover:text-cyan-200">
                          {m.code}
                        </p>
                        {m.seriesFormat && m.seriesFormat !== "BO1" && (
                          <span className="text-[9px] font-bold text-amber-400/60">
                            {m.seriesFormat}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 min-w-0 text-sm">
                        <span className="font-bold text-cyan-300 truncate">
                          {m.blueTeamName || m.bluePlayerName || "Blue"}
                        </span>
                        <span className="text-slate-600 text-xs font-black">VS</span>
                        <span className="font-bold text-rose-300 truncate">
                          {m.redTeamName || m.redPlayerName || "Red"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center gap-1">
                        <span
                          className={`text-lg font-black tabular-nums ${
                            m.winner === "BLUE" ? "text-cyan-300" : "text-slate-400"
                          }`}
                        >
                          {m.blueCost}
                        </span>
                        <span className="text-slate-600">:</span>
                        <span
                          className={`text-lg font-black tabular-nums ${
                            m.winner === "RED" ? "text-rose-300" : "text-slate-400"
                          }`}
                        >
                          {m.redCost}
                        </span>
                      </div>
                      <WinnerBadge winner={m.winner} />
                      <span className="text-[10px] text-slate-500 tabular-nums">
                        {formatDate(m.createdAt)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function WinnerBadge({ winner }: { winner: "BLUE" | "RED" | "DRAW" | null }) {
  if (winner === "BLUE")
    return (
      <span className="rounded-lg bg-cyan-500/15 px-2 py-0.5 text-[10px] font-black text-cyan-300">
        🔵 Blue
      </span>
    );
  if (winner === "RED")
    return (
      <span className="rounded-lg bg-rose-500/15 px-2 py-0.5 text-[10px] font-black text-rose-300">
        🔴 Red
      </span>
    );
  if (winner === "DRAW")
    return (
      <span className="rounded-lg bg-amber-500/15 px-2 py-0.5 text-[10px] font-black text-amber-300">
        ⚖️ Draw
      </span>
    );
  return <span className="text-xs text-slate-500">—</span>;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
