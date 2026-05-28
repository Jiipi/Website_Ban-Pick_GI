"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  ALL_ELEMENTS,
  ELEMENT_COLORS,
  ELEMENT_ICON_URLS,
  type CharacterElement,
} from "@/lib/genshin";
import { playClickSound } from "@/lib/sounds";

type CharacterItem = {
  id: string;
  name: string;
  element: string;
  rarity: number;
  chibiIconUrl: string | null;
};

type StatItem = {
  characterId: string;
  pickCount: number;
  banCount: number;
  totalMatches: number;
};

type Props = {
  characters: CharacterItem[];
  stats: StatItem[];
  totalMatches: number;
};

export function CharactersGalleryClient({ characters, stats, totalMatches }: Props) {
  const [search, setSearch] = useState("");
  const [elementFilter, setElementFilter] = useState<CharacterElement | "ALL">("ALL");
  const [rarityFilter, setRarityFilter] = useState<4 | 5 | 0>(0); // 0 = all
  const [sortBy, setSortBy] = useState<"name" | "pickRate" | "banRate">("name");

  const statsMap = useMemo(() => {
    const m = new Map<string, StatItem>();
    for (const s of stats) m.set(s.characterId, s);
    return m;
  }, [stats]);

  const filtered = useMemo(() => {
    let list = [...characters];

    // search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
    }

    // element
    if (elementFilter !== "ALL") {
      list = list.filter((c) => c.element === elementFilter);
    }

    // rarity
    if (rarityFilter !== 0) {
      list = list.filter((c) => c.rarity === rarityFilter);
    }

    // sort
    if (sortBy === "pickRate") {
      list.sort((a, b) => (statsMap.get(b.id)?.pickCount ?? 0) - (statsMap.get(a.id)?.pickCount ?? 0));
    } else if (sortBy === "banRate") {
      list.sort((a, b) => (statsMap.get(b.id)?.banCount ?? 0) - (statsMap.get(a.id)?.banCount ?? 0));
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [characters, search, elementFilter, rarityFilter, sortBy, statsMap]);

  return (
    <>
      {/* Filters */}
      <div className="glass-strong rounded-2xl px-5 py-4 animate-fade-in-up delay-100">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative sm:w-60">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="input-field pl-9 text-sm"
              placeholder="Tìm nhân vật..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Element chips */}
            <button
              onClick={() => { setElementFilter("ALL"); playClickSound(); }}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                elementFilter === "ALL" ? "bg-slate-100/10 text-slate-100" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              All
            </button>
            {ALL_ELEMENTS.map((el) => (
              <button
                key={el}
                onClick={() => { setElementFilter(elementFilter === el ? "ALL" : el); playClickSound(); }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  elementFilter === el ? "bg-slate-100/10 text-slate-100" : "text-slate-500 hover:text-slate-300"
                }`}
                title={el}
              >
                <ElementIcon element={el} className="h-4 w-4" />
                <span>{el}</span>
              </button>
            ))}

            {/* Rarity */}
            <span className="mx-1 h-4 w-px bg-slate-700/40" />
            <button
              onClick={() => { setRarityFilter(rarityFilter === 5 ? 0 : 5); playClickSound(); }}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-colors ${
                rarityFilter === 5 ? "bg-amber-500/15 text-amber-300" : "text-slate-500 hover:text-amber-300"
              }`}
            >
              5★
            </button>
            <button
              onClick={() => { setRarityFilter(rarityFilter === 4 ? 0 : 4); playClickSound(); }}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-colors ${
                rarityFilter === 4 ? "bg-violet-500/15 text-violet-300" : "text-slate-500 hover:text-violet-300"
              }`}
            >
              4★
            </button>

            {/* Sort */}
            <span className="mx-1 h-4 w-px bg-slate-700/40" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "pickRate" | "banRate")}
              className="rounded border border-slate-700/40 bg-slate-900/60 px-2 py-1 text-[10px] font-bold text-slate-300 focus:outline-none"
            >
              <option value="name">Tên A-Z</option>
              <option value="pickRate">Pick cao nhất</option>
              <option value="banRate">Ban cao nhất</option>
            </select>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-slate-500">
          Đang hiện {filtered.length} / {characters.length} nhân vật
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
        {filtered.map((ch) => {
          const stat = statsMap.get(ch.id);
          const pickCount = stat?.pickCount ?? 0;
          const banCount = stat?.banCount ?? 0;
          const elementColor = ELEMENT_COLORS[ch.element as CharacterElement] ?? "#C0C0C0";
          const rarityBg = ch.rarity === 5 ? "bg-amber-500/15" : "bg-violet-500/15";

          return (
            <Link
              key={ch.id}
              href={`/characters/${ch.id}`}
              className="group glass rounded-2xl overflow-hidden transition-all hover:scale-[1.03] hover:border-cyan-500/30"
              style={{ borderColor: `${elementColor}30` }}
            >
              {/* Avatar */}
              <div className={`relative aspect-square ${rarityBg} flex items-center justify-center overflow-hidden`}>
                {ch.chibiIconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ch.chibiIconUrl}
                    alt={ch.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <ElementIcon
                    element={ch.element as CharacterElement}
                    className="h-9 w-9 opacity-60"
                  />
                )}

                {/* Element badge */}
                <span
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border shadow"
                  style={{
                    background: `${elementColor}28`,
                    borderColor: `${elementColor}55`,
                    color: elementColor,
                  }}
                  title={ch.element}
                >
                  <ElementIcon element={ch.element as CharacterElement} className="h-4 w-4" />
                </span>

                {/* Rarity stars */}
                <span className="absolute bottom-1 left-1 text-[8px] text-amber-300">
                  {"★".repeat(ch.rarity)}
                </span>
              </div>

              {/* Info */}
              <div className="px-2 py-2">
                <p className="truncate text-[11px] font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                  {ch.name}
                </p>
                {totalMatches > 0 && (
                  <div className="mt-1 flex gap-2 text-[9px] tabular-nums">
                    <span className="text-cyan-400">{pickCount}P</span>
                    <span className="text-rose-400">{banCount}B</span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="glass-strong rounded-2xl py-16 text-center">
          <p className="text-3xl">🔍</p>
          <p className="mt-3 font-bold text-slate-400">Không tìm thấy nhân vật</p>
          <p className="mt-1 text-sm text-slate-500">Thử từ khoá khác hoặc bỏ filter</p>
        </div>
      )}
    </>
  );
}

function ElementIcon({
  element,
  className,
}: {
  element: CharacterElement;
  className: string;
}) {
  const iconUrl = ELEMENT_ICON_URLS[element];

  if (iconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={iconUrl}
        alt=""
        aria-hidden="true"
        className={`${className} object-contain drop-shadow`}
        loading="lazy"
      />
    );
  }

  return (
    <span className={`inline-flex items-center justify-center ${className} text-[10px] font-black`}>
      {element.slice(0, 2)}
    </span>
  );
}
