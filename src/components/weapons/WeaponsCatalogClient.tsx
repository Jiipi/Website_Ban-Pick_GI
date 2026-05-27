"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Search, Filter } from "lucide-react";

type Weapon = {
  id: string;
  name: string;
  type: string;
  rarity: 4 | 5;
  iconUrl: string;
};

const WEAPON_TYPE_LABELS: Record<string, string> = {
  sword: "Kiếm",
  claymore: "Đại kiếm",
  polearm: "Thương",
  bow: "Cung",
  catalyst: "Pháp khí",
};

const WEAPON_TYPE_COLORS: Record<string, string> = {
  sword: "text-cyan-300 bg-cyan-500/10 border-cyan-500/30",
  claymore: "text-rose-300 bg-rose-500/10 border-rose-500/30",
  polearm: "text-violet-300 bg-violet-500/10 border-violet-500/30",
  bow: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
  catalyst: "text-amber-300 bg-amber-500/10 border-amber-500/30",
};

export function WeaponsCatalogClient({ weapons }: { weapons: Weapon[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [rarityFilter, setRarityFilter] = useState<4 | 5 | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "rarity">("rarity");

  const types = useMemo(() => {
    const set = new Set<string>();
    for (const w of weapons) set.add(w.type);
    return Array.from(set).sort();
  }, [weapons]);

  const filtered = useMemo(() => {
    let result = weapons;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((w) => w.name.toLowerCase().includes(q));
    }
    if (typeFilter) result = result.filter((w) => w.type === typeFilter);
    if (rarityFilter) result = result.filter((w) => w.rarity === rarityFilter);
    if (sortBy === "name") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result = [...result].sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name));
    }
    return result;
  }, [weapons, search, typeFilter, rarityFilter, sortBy]);

  if (weapons.length === 0) {
    return (
      <div className="glass-strong rounded-3xl py-16 text-center animate-fade-in-up delay-100">
        <p className="text-3xl">⚔️</p>
        <p className="mt-3 text-sm text-slate-400">Không tải được dữ liệu vũ khí</p>
        <p className="mt-1 text-xs text-slate-500">Vui lòng thử lại sau</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up delay-100">
      {/* Filters */}
      <div className="glass-strong rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm vũ khí..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 w-full"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "rarity")}
            className="input-field"
          >
            <option value="rarity">Sắp xếp: Độ hiếm</option>
            <option value="name">Sắp xếp: Tên</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <Filter size={10} />
            Loại:
          </span>
          <button
            onClick={() => setTypeFilter(null)}
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              typeFilter === null ? "bg-slate-700/60 text-slate-100" : "bg-slate-800/40 text-slate-400 hover:text-slate-200"
            }`}
          >
            Tất cả
          </button>
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t === typeFilter ? null : t)}
              className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                typeFilter === t
                  ? WEAPON_TYPE_COLORS[t] ?? "bg-slate-700/60 text-slate-100 border-slate-600"
                  : "border-slate-700/40 bg-slate-800/40 text-slate-400 hover:text-slate-200"
              }`}
            >
              {WEAPON_TYPE_LABELS[t] ?? t}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Độ hiếm:</span>
          <button
            onClick={() => setRarityFilter(null)}
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              rarityFilter === null ? "bg-slate-700/60 text-slate-100" : "bg-slate-800/40 text-slate-400 hover:text-slate-200"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setRarityFilter(rarityFilter === 5 ? null : 5)}
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              rarityFilter === 5 ? "bg-amber-500/20 text-amber-200" : "bg-slate-800/40 text-slate-400 hover:text-slate-200"
            }`}
          >
            ★ 5 sao
          </button>
          <button
            onClick={() => setRarityFilter(rarityFilter === 4 ? null : 4)}
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              rarityFilter === 4 ? "bg-violet-500/20 text-violet-200" : "bg-slate-800/40 text-slate-400 hover:text-slate-200"
            }`}
          >
            ★ 4 sao
          </button>
        </div>

        <p className="text-[10px] text-slate-500">
          Hiển thị <span className="font-bold text-slate-300">{filtered.length}</span> / {weapons.length} vũ khí
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((w) => (
          <article
            key={w.id}
            className={`glass-strong rounded-2xl p-3 transition-transform hover:scale-[1.02] ${
              w.rarity === 5 ? "ring-1 ring-amber-500/30" : "ring-1 ring-violet-500/20"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-800/60">
                {w.iconUrl && (
                  <Image
                    src={w.iconUrl}
                    alt={w.name}
                    width={56}
                    height={56}
                    className="object-contain"
                    unoptimized
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-100">{w.name}</p>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${
                  w.rarity === 5 ? "text-amber-300" : "text-violet-300"
                }`}>
                  {"★".repeat(w.rarity)}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  {WEAPON_TYPE_LABELS[w.type] ?? w.type}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="glass-strong rounded-2xl py-12 text-center">
          <p className="text-2xl">🔍</p>
          <p className="mt-2 text-sm text-slate-400">Không tìm thấy vũ khí phù hợp</p>
        </div>
      )}
    </div>
  );
}
