"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { RotateCcw, Shuffle, Star } from "lucide-react";
import {
  ALL_ELEMENTS,
  ELEMENT_COLORS,
  getCharacterIconUrl,
  type CharacterElement,
} from "@/lib/genshin";

type RandomizerCharacter = {
  id: string;
  name: string;
  element: string;
  rarity: number;
};

type Props = {
  characters: RandomizerCharacter[];
};

const COUNT_OPTIONS = [1, 2, 4, 8] as const;
const RARITY_OPTIONS = [4, 5] as const;

function pickRandom<T>(items: T[], count: number): T[] {
  const pool = [...items];
  const picked: T[] = [];
  const take = Math.min(count, pool.length);
  for (let i = 0; i < take; i += 1) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool[index]);
    pool.splice(index, 1);
  }
  return picked;
}

export function CharacterRandomizerClient({ characters }: Props) {
  const [selectedElements, setSelectedElements] = useState<Set<string>>(
    () => new Set(ALL_ELEMENTS),
  );
  const [selectedRarities, setSelectedRarities] = useState<Set<number>>(
    () => new Set([4, 5]),
  );
  const [count, setCount] = useState<number>(4);
  const [results, setResults] = useState<RandomizerCharacter[]>([]);
  const [error, setError] = useState<string>("");

  const filtered = useMemo(() => {
    return characters.filter(
      (c) => selectedElements.has(c.element) && selectedRarities.has(c.rarity),
    );
  }, [characters, selectedElements, selectedRarities]);

  function toggleElement(element: string) {
    setSelectedElements((prev) => {
      const next = new Set(prev);
      if (next.has(element)) next.delete(element);
      else next.add(element);
      return next;
    });
  }

  function toggleRarity(rarity: number) {
    setSelectedRarities((prev) => {
      const next = new Set(prev);
      if (next.has(rarity)) next.delete(rarity);
      else next.add(rarity);
      return next;
    });
  }

  function handleRandomize() {
    setError("");
    if (filtered.length < count) {
      setResults([]);
      setError(`Không đủ nhân vật (cần ${count}, có ${filtered.length}).`);
      return;
    }
    setResults(pickRandom(filtered, count));
  }

  function handleClear() {
    setResults([]);
    setError("");
  }

  return (
    <>
      {/* Filter panel */}
      <div className="glass-strong rounded-2xl px-5 py-5 animate-fade-in-up delay-100 space-y-5">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Nguyên tố
          </p>
          <div className="flex flex-wrap gap-2">
            {ALL_ELEMENTS.map((element) => {
              const active = selectedElements.has(element);
              const color = ELEMENT_COLORS[element as CharacterElement];
              return (
                <button
                  key={element}
                  type="button"
                  onClick={() => toggleElement(element)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                    active
                      ? "text-slate-100"
                      : "border-slate-700/60 bg-slate-900/40 text-slate-500 hover:text-slate-300"
                  }`}
                  style={
                    active
                      ? { borderColor: color, backgroundColor: `${color}22` }
                      : undefined
                  }
                >
                  {element}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Rarity
            </p>
            <div className="flex gap-2">
              {RARITY_OPTIONS.map((rarity) => {
                const active = selectedRarities.has(rarity);
                return (
                  <button
                    key={rarity}
                    type="button"
                    onClick={() => toggleRarity(rarity)}
                    className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                      active
                        ? "border-amber-400/60 bg-amber-500/10 text-amber-200"
                        : "border-slate-700/60 bg-slate-900/40 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {rarity}
                    <Star size={12} className="fill-current" />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Số lượng
            </p>
            <div className="flex gap-2">
              {COUNT_OPTIONS.map((option) => {
                const active = count === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setCount(option)}
                    className={`min-w-[2.5rem] rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                      active
                        ? "border-rose-400/60 bg-rose-500/10 text-rose-200"
                        : "border-slate-700/60 bg-slate-900/40 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-xs text-slate-500">
            Đang lọc: <span className="font-mono font-bold text-slate-300">{filtered.length}</span> / {characters.length} nhân vật
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={handleClear} className="btn-outline">
              <RotateCcw size={14} />
              Clear
            </button>
            <button type="button" onClick={handleRandomize} className="btn-primary">
              <Shuffle size={14} />
              Randomize
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-strong rounded-2xl border border-rose-500/40 bg-rose-500/5 px-5 py-4 text-sm font-bold text-rose-200 animate-fade-in-up">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="glass-strong rounded-2xl px-5 py-5 animate-fade-in-up">
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
            Kết quả ({results.length})
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {results.map((character, index) => {
              const color = ELEMENT_COLORS[character.element as CharacterElement] ?? "#94a3b8";
              return (
                <div
                  key={`${character.id}-${index}`}
                  className="rounded-2xl border bg-slate-900/40 px-3 py-3"
                  style={{ borderColor: `${color}55` }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border"
                      style={{ borderColor: `${color}66`, backgroundColor: `${color}11` }}
                    >
                      <Image
                        src={getCharacterIconUrl(character.id)}
                        alt={character.name}
                        width={64}
                        height={64}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-100">
                        {character.name}
                      </p>
                      <span
                        className="mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                        style={{ backgroundColor: `${color}22`, color }}
                      >
                        {character.element}
                      </span>
                      <div className="mt-1 flex items-center gap-0.5 text-amber-300">
                        {Array.from({ length: character.rarity }).map((_, i) => (
                          <Star key={i} size={10} className="fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
