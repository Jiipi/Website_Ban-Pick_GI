"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Trophy, User, Sword, FileText, X } from "lucide-react";

type SearchHit = {
  type: "character" | "tournament" | "player" | "page";
  title: string;
  subtitle: string | null;
  link: string;
  iconUrl: string | null;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Open with Ctrl+K / Cmd+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus on open
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      setHits([]);
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHits([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const body = await res.json();
        if (!cancelled) {
          setHits(body.hits ?? []);
          setActiveIdx(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  function navigate(hit: SearchHit) {
    setOpen(false);
    router.push(hit.link);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(hits.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && hits[activeIdx]) {
      e.preventDefault();
      navigate(hits[activeIdx]);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[10vh] sm:pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700/40 bg-slate-900/95 backdrop-blur-md shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-slate-800/60 px-4 py-3">
          <Search size={16} className="text-slate-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Tìm tướng, giải đấu, player, trang..."
            className="flex-1 bg-transparent text-sm font-medium text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <kbd className="rounded bg-slate-800/60 px-1.5 py-0.5 font-mono text-[9px] text-slate-400">ESC</kbd>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-500 hover:text-slate-300"
          >
            <X size={14} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!query.trim() ? (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-slate-500">Bắt đầu gõ để tìm...</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 text-[10px] text-slate-400">
                <span>Mẹo:</span>
                <kbd className="rounded bg-slate-800/60 px-1.5 py-0.5 font-mono">↑↓</kbd>
                <span>để di chuyển</span>
                <kbd className="rounded bg-slate-800/60 px-1.5 py-0.5 font-mono">↵</kbd>
                <span>để chọn</span>
              </div>
            </div>
          ) : loading ? (
            <div className="px-4 py-8 text-center text-xs text-slate-400">Đang tìm...</div>
          ) : hits.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-2xl">🔍</p>
              <p className="mt-2 text-xs text-slate-400">Không có kết quả</p>
            </div>
          ) : (
            <div className="py-2">
              {hits.map((hit, idx) => (
                <Link
                  key={`${hit.type}-${hit.link}`}
                  href={hit.link}
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => setActiveIdx(idx)}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    idx === activeIdx ? "bg-cyan-500/10" : ""
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800/60 text-slate-300 overflow-hidden">
                    {hit.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={hit.iconUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <TypeIcon type={hit.type} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-200 truncate">{hit.title}</p>
                    {hit.subtitle && (
                      <p className="text-[11px] text-slate-500 truncate">{hit.subtitle}</p>
                    )}
                  </div>
                  <span className="font-mono text-[9px] text-slate-600 uppercase tracking-wider">
                    {hit.type}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case "character":
      return <Sword size={14} />;
    case "tournament":
      return <Trophy size={14} />;
    case "player":
      return <User size={14} />;
    default:
      return <FileText size={14} />;
  }
}
