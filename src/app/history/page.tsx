"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { getOrCreateClientId } from "@/lib/auth";
import { playClickSound } from "@/lib/sounds";

type HistoryEntry = {
  id: string;
  code: string;
  status: string;
  costPerPoint: number;
  hostName: string | null;
  bluePlayerName: string | null;
  redPlayerName: string | null;
  blueCost: number;
  redCost: number;
  winner: "BLUE" | "RED" | "DRAW" | null;
  pickCount: number;
  createdAt: string;
};

const PAGE_SIZE = 20;

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [undoId, setUndoId] = useState<string | null>(null);
  const [undoEntry, setUndoEntry] = useState<HistoryEntry | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/history");
        const data = await res.json();
        if (!cancelled) setHistory(data.history ?? []);
      } catch {
        if (!cancelled) setHistory([]);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = search
    ? history.filter(
        (h) =>
          h.code.toLowerCase().includes(search.toLowerCase()) ||
          h.bluePlayerName?.toLowerCase().includes(search.toLowerCase()) ||
          h.redPlayerName?.toLowerCase().includes(search.toLowerCase())
      )
    : history;

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  async function handleDelete(id: string) {
    setDeleting(id);
    setDeleteError("");
    playClickSound();

    const clientId = getOrCreateClientId();
    const res = await fetch(`/api/history?id=${id}&clientId=${encodeURIComponent(clientId)}`, { method: "DELETE" });

    if (res.ok) {
      setHistory((prev) => prev.filter((h) => h.id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.message ?? "Không xoá được");
    }
    setDeleting(null);
  }

  function startDelete(id: string) {
    const entry = history.find((h) => h.id === id);
    if (!entry) return;

    // Show toast
    setUndoId(id);
    setUndoEntry(entry);
    setHistory((prev) => prev.filter((h) => h.id !== id));
    setDeleteError("");

    // Auto-delete after 5s
    undoTimer.current = setTimeout(() => {
      handleDelete(id);
      setUndoId(null);
      setUndoEntry(null);
    }, 5000);
  }

  function undoDelete() {
    if (undoEntry) {
      setHistory((prev) => [...prev, undoEntry]);
    }
    if (undoTimer.current) {
      clearTimeout(undoTimer.current);
      undoTimer.current = null;
    }
    setUndoId(null);
    setUndoEntry(null);
  }

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }, []);

  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="glass-strong rounded-2xl px-6 py-5 animate-fade-in-up">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-2xl">📜</div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Genshin Impact</p>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">
                    <span className="text-gradient-gold">Lịch Sử Giải Đấu</span>
                  </h1>
                </div>
              </div>
              <Link href="/" className="btn-outline shrink-0">
                ← Trang chủ
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="glass-strong rounded-2xl px-5 py-4 animate-fade-in-up delay-100">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tổng cộng {filtered.length} trận
                </p>
              </div>
              <div className="relative sm:w-72">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">🔍</span>
                <input
                  className="input-field pl-9 text-sm"
                  placeholder="Tìm mã phòng, tên người chơi..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
                />
              </div>
            </div>
          </div>

          {/* Toast undo bar */}
          {undoId && undoEntry && (
            <div className="animate-scale-in sticky top-14 z-40 rounded-xl border border-amber-500/30 bg-amber-950/50 px-4 py-3 flex items-center justify-between gap-3 backdrop-blur-md">
              <p className="text-sm text-amber-200">
                Đã xoá trận <strong className="font-mono">{undoEntry.code}</strong>
              </p>
              <button
                className="rounded-lg bg-amber-500/15 px-4 py-1.5 text-sm font-bold text-amber-300 hover:bg-amber-500/25 transition-colors"
                onClick={undoDelete}
                type="button"
              >
                ↩ Undo
              </button>
            </div>
          )}

          {deleteError && (
            <p className="animate-scale-in rounded-xl border border-red-800/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              ⚠️ {deleteError}
            </p>
          )}

          {/* Content */}
          <div className="glass-strong rounded-2xl overflow-hidden animate-fade-in-up delay-200">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
              </div>
            ) : visible.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-4xl">📭</div>
                <p className="mt-3 font-bold text-slate-400">
                  {search ? "Không tìm thấy kết quả" : "Chưa có trận đấu nào"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {search ? "Thử từ khoá khác" : "Tạo phòng mới để bắt đầu"}
                </p>
                {!search && (
                  <Link href="/" className="btn-primary mt-5 inline-flex">
                    Tạo phòng mới
                  </Link>
                )}
              </div>
            ) : (
              <>
                {/* Desktop table — hidden on mobile */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700/40">
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Phòng</th>
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Đội Xanh</th>
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Đội Đỏ</th>
                        <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Cost</th>
                        <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Kết quả</th>
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Thời gian</th>
                        <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((entry) => (
                        <HistoryRow key={entry.id} entry={entry} deleting={deleting} onDelete={startDelete} />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards — shown on mobile only */}
                <div className="md:hidden divide-y divide-slate-800/40">
                  {visible.map((entry) => (
                    <HistoryCard key={entry.id} entry={entry} deleting={deleting} onDelete={startDelete} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="text-center">
              <button
                className="btn-outline"
                onClick={loadMore}
                type="button"
              >
                Xem thêm ({filtered.length - visibleCount} trận)
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function HistoryRow({
  entry,
  deleting,
  onDelete,
}: {
  entry: HistoryEntry;
  deleting: string | null;
  onDelete: (id: string) => void;
}) {
  return (
    <tr className="group border-b border-slate-800/40 transition-colors hover:bg-slate-800/20">
      <td className="px-4 py-3">
        <Link
          href={`/room/${entry.code}`}
          className="font-mono text-xs font-black tracking-widest text-cyan-300 hover:text-cyan-200 hover:underline"
        >
          {entry.code}
        </Link>
        <p className="text-[10px] text-slate-500">
          {entry.status === "FINISHED" ? "✓ Hoàn tất" : entry.status === "BUILDING" ? "⚙ Đang build" : entry.status === "DRAFTING" ? "⚔ Drafting" : "⏳ Chờ"}
        </p>
      </td>
      <td className="px-4 py-3">
        <p className="font-bold text-cyan-300">{entry.bluePlayerName ?? "—"}</p>
        <p className="text-xs tabular-nums text-slate-400">{entry.blueCost} cost</p>
      </td>
      <td className="px-4 py-3">
        <p className="font-bold text-rose-300">{entry.redPlayerName ?? "—"}</p>
        <p className="text-xs tabular-nums text-slate-400">{entry.redCost} cost</p>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <span className={`text-lg font-black tabular-nums ${entry.blueCost > entry.redCost ? "text-cyan-300" : "text-slate-400"}`}>{entry.blueCost}</span>
          <span className="text-slate-600">:</span>
          <span className={`text-lg font-black tabular-nums ${entry.redCost > entry.blueCost ? "text-rose-300" : "text-slate-400"}`}>{entry.redCost}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <WinnerBadge winner={entry.winner} />
      </td>
      <td className="px-4 py-3">
        <p className="text-xs text-slate-400">{formatTime(entry.createdAt)}</p>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <Link
            href={`/room/${entry.code}`}
            className="rounded-lg px-2.5 py-1 text-xs font-bold text-cyan-400 transition-colors hover:bg-cyan-500/10 hover:text-cyan-300"
          >
            Xem
          </Link>
          <button
            onClick={() => onDelete(entry.id)}
            disabled={deleting === entry.id}
            className="rounded-lg px-2.5 py-1 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-30"
          >
            {deleting === entry.id ? "..." : "Xoá"}
          </button>
        </div>
      </td>
    </tr>
  );
}

function HistoryCard({
  entry,
  deleting,
  onDelete,
}: {
  entry: HistoryEntry;
  deleting: string | null;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Link
          href={`/room/${entry.code}`}
          className="font-mono text-sm font-black tracking-widest text-cyan-300 hover:text-cyan-200 hover:underline"
        >
          {entry.code}
        </Link>
        <WinnerBadge winner={entry.winner} />
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex-1">
          <p className="font-bold text-cyan-300">{entry.bluePlayerName ?? "—"}</p>
          <p className="text-xs tabular-nums text-slate-400">{entry.blueCost} cost</p>
        </div>
        <div className="text-lg font-black text-slate-500">VS</div>
        <div className="flex-1 text-right">
          <p className="font-bold text-rose-300">{entry.redPlayerName ?? "—"}</p>
          <p className="text-xs tabular-nums text-slate-400">{entry.redCost} cost</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500">
        <span>{formatTime(entry.createdAt)}</span>
        <div className="flex items-center gap-2">
          <Link
            href={`/room/${entry.code}`}
            className="rounded-lg px-2.5 py-1 text-xs font-bold text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
          >
            Xem
          </Link>
          <button
            onClick={() => onDelete(entry.id)}
            disabled={deleting === entry.id}
            className="rounded-lg px-2.5 py-1 text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-30"
          >
            {deleting === entry.id ? "..." : "Xoá"}
          </button>
        </div>
      </div>
    </div>
  );
}

function WinnerBadge({ winner }: { winner: "BLUE" | "RED" | "DRAW" | null }) {
  if (winner === "BLUE") return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/15 px-2.5 py-1 text-xs font-black text-cyan-300">
      🔵 Xanh
    </span>
  );
  if (winner === "RED") return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-rose-500/15 px-2.5 py-1 text-xs font-black text-rose-300">
      🔴 Đỏ
    </span>
  );
  if (winner === "DRAW") return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-black text-amber-300">
      ⚖️ Hoà
    </span>
  );
  return <span className="text-xs text-slate-500">—</span>;
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
