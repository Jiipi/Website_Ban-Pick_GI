"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { RotateCcw, Search, ShieldAlert, Sparkles, X } from "lucide-react";
import { ELEMENT_COLORS, getCharacterIconUrl } from "@/lib/genshin";

type Character = { id: string; name: string; element: string; rarity: number };

type Props = { characters: Character[] };

const ELEMENTS = ["Pyro", "Hydro", "Anemo", "Electro", "Dendro", "Cryo", "Geo"];
const SLOT_COUNT = 8;

function characterCost(character: Character, consLevel: number, weaponRarity: number) {
  return (character.rarity === 5 ? 1 + consLevel : 0) + (weaponRarity === 5 ? 1 : 0);
}

export function TeamBuilderClient({ characters }: Props) {
  const [team, setTeam] = useState<(string | null)[]>(() => Array.from({ length: SLOT_COUNT }, () => null));
  const [search, setSearch] = useState("");
  const [elementFilter, setElementFilter] = useState<string | null>(null);
  const [consLevels, setConsLevels] = useState<Record<string, number>>({});
  const [weaponRarities, setWeaponRarities] = useState<Record<string, number>>({});

  const characterById = useMemo(() => new Map(characters.map((character) => [character.id, character])), [characters]);
  const selectedIds = useMemo(() => team.filter(Boolean) as string[], [team]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedCharacters = selectedIds.map((id) => characterById.get(id)).filter(Boolean) as Character[];

  const filteredCharacters = useMemo(() => {
    const query = search.trim().toLowerCase();
    return characters.filter((character) => {
      const matchesSearch = !query || character.name.toLowerCase().includes(query);
      const matchesElement = !elementFilter || character.element === elementFilter;
      return matchesSearch && matchesElement;
    });
  }, [characters, elementFilter, search]);

  const totalCost = selectedCharacters.reduce((sum, character) => {
    return sum + characterCost(character, consLevels[character.id] ?? 0, weaponRarities[character.id] ?? 4);
  }, 0);
  const coveredElements = new Set(selectedCharacters.map((character) => character.element));
  const missingElements = ELEMENTS.filter((element) => !coveredElements.has(element));
  const fiveStars = selectedCharacters.filter((character) => character.rarity === 5).length;
  const fourStars = selectedCharacters.filter((character) => character.rarity === 4).length;

  function addCharacter(characterId: string) {
    if (selectedSet.has(characterId)) return;
    const emptyIndex = team.findIndex((slot) => slot === null);
    if (emptyIndex === -1) return;
    setTeam((prev) => prev.map((slot, index) => (index === emptyIndex ? characterId : slot)));
  }

  function removeSlot(index: number) {
    setTeam((prev) => prev.map((slot, slotIndex) => (slotIndex === index ? null : slot)));
  }

  function clearAll() {
    setTeam(Array.from({ length: SLOT_COUNT }, () => null));
    setConsLevels({});
    setWeaponRarities({});
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="glass-strong rounded-3xl p-5 sm:p-6 animate-fade-in-up delay-100">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-300">Team slots</p>
              <h2 className="mt-1 text-xl font-black text-slate-100">Đội hình 8 nhân vật</h2>
            </div>
            <button type="button" onClick={clearAll} className="btn-outline">
              <RotateCcw size={14} />
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {team.map((characterId, index) => {
              const character = characterId ? characterById.get(characterId) : null;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => removeSlot(index)}
                  disabled={!character}
                  className="group relative min-h-40 overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/50 p-3 text-left transition hover:border-cyan-400/50 disabled:cursor-default disabled:hover:border-slate-700/50"
                >
                  {character ? (
                    <>
                      <span className="absolute right-2 top-2 z-10 rounded-full bg-slate-950/80 p-1 text-slate-400 opacity-0 transition group-hover:opacity-100">
                        <X size={14} />
                      </span>
                      <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-slate-800/80">
                        <Image src={getCharacterIconUrl(character.id)} alt={character.name} width={80} height={80} unoptimized />
                      </div>
                      <p className="mt-3 line-clamp-2 text-center text-sm font-black text-slate-100">{character.name}</p>
                      <div className="mt-2 flex justify-center">
                        <ElementBadge element={character.element} />
                      </div>
                      <p className="mt-2 text-center text-xs font-bold text-amber-200">{character.rarity}★</p>
                    </>
                  ) : (
                    <div className="flex h-full min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/70 text-center text-slate-500">
                      <Sparkles size={20} />
                      <span className="mt-2 text-xs font-bold uppercase tracking-wider">Slot {index + 1}</span>
                      <span className="mt-1 text-[11px]">Chọn từ danh sách</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="glass-strong rounded-3xl p-5 sm:p-6 animate-fade-in-up delay-200">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-400">Summary</p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <SummaryBox label="Cost" value={totalCost.toString()} accent="text-cyan-300" />
            <SummaryBox label="Elements" value={`${coveredElements.size}/7`} accent="text-emerald-300" />
            <SummaryBox label="Rarity" value={`${fiveStars}x5★`} accent="text-amber-300" sub={`${fourStars}x4★`} />
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Element coverage</p>
            <div className="flex flex-wrap gap-2">
              {ELEMENTS.map((element) => {
                const covered = coveredElements.has(element);
                return (
                  <span
                    key={element}
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${
                      covered ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" : "border-slate-700/60 bg-slate-900/40 text-slate-500"
                    }`}
                  >
                    {element}
                  </span>
                );
              })}
            </div>
            {missingElements.length > 0 && (
              <p className="mt-3 flex gap-2 text-xs leading-relaxed text-slate-400">
                <ShieldAlert size={14} className="mt-0.5 shrink-0 text-amber-300" />
                Thiếu nguyên tố: {missingElements.join(", ")}. Đây chỉ là cảnh báo tham khảo, không chặn đội hình.
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="glass-strong rounded-3xl p-5 sm:p-6 animate-fade-in-up delay-300">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-400">Character pool</p>
            <h2 className="mt-1 text-xl font-black text-slate-100">Chọn nhân vật</h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm nhân vật..."
                className="input-field w-full pl-9 sm:w-64"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setElementFilter(null)}
                className={`rounded-full border px-3 py-2 text-xs font-bold transition ${!elementFilter ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-200" : "border-slate-700/50 text-slate-400 hover:text-slate-200"}`}
              >
                All
              </button>
              {ELEMENTS.map((element) => (
                <button
                  key={element}
                  type="button"
                  onClick={() => setElementFilter(elementFilter === element ? null : element)}
                  className={`rounded-full border px-3 py-2 text-xs font-bold transition ${elementFilter === element ? "border-cyan-400/40 bg-cyan-500/10 text-cyan-200" : "border-slate-700/50 text-slate-400 hover:text-slate-200"}`}
                >
                  {element}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid max-h-[520px] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filteredCharacters.map((character) => {
            const selected = selectedSet.has(character.id);
            const full = selectedIds.length >= SLOT_COUNT;
            return (
              <button
                key={character.id}
                type="button"
                disabled={selected || full}
                onClick={() => addCharacter(character.id)}
                className="rounded-2xl border border-slate-700/50 bg-slate-900/45 p-3 text-left transition hover:border-cyan-400/50 hover:bg-cyan-500/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-slate-800/80">
                  <Image src={getCharacterIconUrl(character.id)} alt={character.name} width={64} height={64} unoptimized />
                </div>
                <p className="mt-2 line-clamp-2 min-h-10 text-center text-xs font-black text-slate-100">{character.name}</p>
                <div className="mt-2 flex items-center justify-center gap-1">
                  <ElementBadge element={character.element} />
                  <span className="text-[10px] font-bold text-amber-200">{character.rarity}★</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="glass-strong rounded-3xl p-5 sm:p-6 animate-fade-in-up delay-400">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-400">Cost preview</p>
            <h2 className="mt-1 text-xl font-black text-slate-100">Tổng cost: <span className="text-cyan-300">{totalCost}</span></h2>
          </div>
        </div>
        {selectedCharacters.length === 0 ? (
          <p className="rounded-2xl border border-slate-700/40 bg-slate-900/40 p-4 text-sm text-slate-400">Chưa chọn nhân vật nào.</p>
        ) : (
          <div className="space-y-3">
            {selectedCharacters.map((character) => {
              const consLevel = consLevels[character.id] ?? 0;
              const weaponRarity = weaponRarities[character.id] ?? 4;
              const cost = characterCost(character, consLevel, weaponRarity);
              return (
                <div key={character.id} className="grid gap-3 rounded-2xl border border-slate-700/40 bg-slate-900/40 p-3 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="flex items-center gap-3">
                    <Image src={getCharacterIconUrl(character.id)} alt={character.name} width={48} height={48} className="rounded-xl bg-slate-800" unoptimized />
                    <div>
                      <p className="font-black text-slate-100">{character.name}</p>
                      <p className="text-xs text-slate-400">{character.rarity}★ {character.element} · Cost {cost}</p>
                    </div>
                  </div>
                  {character.rarity === 5 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={consLevel}
                        onChange={(e) => setConsLevels((prev) => ({ ...prev, [character.id]: Number(e.target.value) }))}
                        className="rounded-lg border border-slate-700/50 bg-slate-950/60 px-3 py-2 text-xs font-bold text-slate-100 focus:border-cyan-500/50 focus:outline-none"
                      >
                        {Array.from({ length: 7 }, (_, index) => (
                          <option key={index} value={index}>C{index}</option>
                        ))}
                      </select>
                      <div className="flex rounded-lg border border-slate-700/50 bg-slate-950/60 p-1">
                        {[4, 5].map((rarity) => (
                          <button
                            key={rarity}
                            type="button"
                            onClick={() => setWeaponRarities((prev) => ({ ...prev, [character.id]: rarity }))}
                            className={`rounded-md px-3 py-1 text-xs font-black transition ${weaponRarity === rarity ? "bg-cyan-500/20 text-cyan-200" : "text-slate-500 hover:text-slate-200"}`}
                          >
                            {rarity}★ wpn
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">4★ character: cons không cộng cost.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function ElementBadge({ element }: { element: string }) {
  const color = ELEMENT_COLORS[element as keyof typeof ELEMENT_COLORS] ?? "#94a3b8";
  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] font-black text-slate-950" style={{ backgroundColor: color }}>
      {element}
    </span>
  );
}

function SummaryBox({ label, value, accent, sub }: { label: string; value: string; accent: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-700/40 bg-slate-900/40 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-black ${accent}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
    </div>
  );
}
