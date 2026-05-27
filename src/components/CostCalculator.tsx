"use client";

import { useState } from "react";
import Image from "next/image";
import { calculateCharacterCost } from "@/lib/cost";
import { getCharacterIconUrl } from "@/lib/genshin";
import { playClickSound } from "@/lib/sounds";

type CostCalculatorProps = {
  characterId: string;
  characterName: string;
  initial?: { rarity: number; consLevel: number; weaponRarity: number };
  onChange: (value: { characterId: string; rarity: number; consLevel: number; weaponRarity: number; totalCost: number }) => void;
};

export function CostCalculator({ characterId, characterName, initial, onChange }: CostCalculatorProps) {
  const [rarity, setRarity] = useState(initial?.rarity ?? 5);
  const [consLevel, setConsLevel] = useState(initial?.consLevel ?? 0);
  const [weaponRarity, setWeaponRarity] = useState(initial?.weaponRarity ?? 4);
  const totalCost = calculateCharacterCost(rarity, consLevel, weaponRarity);

  function emit(next: { rarity?: number; consLevel?: number; weaponRarity?: number }) {
    const value = {
      characterId,
      rarity: next.rarity ?? rarity,
      consLevel: next.consLevel ?? consLevel,
      weaponRarity: next.weaponRarity ?? weaponRarity,
    };

    onChange({ ...value, totalCost: calculateCharacterCost(value.rarity, value.consLevel, value.weaponRarity) });
  }

  return (
    <div className="glass rounded-xl p-4 transition-all hover:border-slate-600/40">
      <div className="flex items-start gap-4">
        {/* Character icon */}
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-700/40 bg-slate-900/60">
          <Image
            src={getCharacterIconUrl(characterId)}
            alt={characterName}
            fill
            sizes="56px"
            className="object-contain"
            unoptimized
          />
        </div>

        {/* Controls */}
        <div className="flex-1">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-100">{characterName}</p>
            {/* Cost display */}
            <div className="flex items-center gap-2 rounded-lg bg-slate-950/60 px-3 py-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cost</span>
              <span className={`text-lg font-black tabular-nums ${costColor(totalCost)}`}>
                {totalCost}
              </span>
              <div className="flex gap-0.5">
                {Array.from({ length: Math.min(totalCost, 8) }).map((_, i) => (
                  <span key={i} className={`inline-block h-1.5 w-1.5 rounded-full ${costDotColor(totalCost)}`} />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Rarity */}
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Nhân vật
              </label>
              <div className="segment-control w-full">
                <button
                  className={`flex-1 text-xs ${rarity === 4 ? "active" : ""}`}
                  onClick={() => { setRarity(4); emit({ rarity: 4 }); playClickSound(); }}
                  type="button"
                >
                  <span className="text-purple-400">4★</span>
                </button>
                <button
                  className={`flex-1 text-xs ${rarity === 5 ? "active" : ""}`}
                  onClick={() => { setRarity(5); emit({ rarity: 5 }); playClickSound(); }}
                  type="button"
                >
                  <span className="text-amber-400">5★</span>
                </button>
              </div>
            </div>

            {/* Constellation */}
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Cung mệnh
              </label>
              <select
                className="select-field text-sm"
                value={consLevel}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setConsLevel(value);
                  emit({ consLevel: value });
                  playClickSound();
                }}
              >
                {[0, 1, 2, 3, 4, 5, 6].map((value) => (
                  <option key={value} value={value}>C{value}</option>
                ))}
              </select>
            </div>

            {/* Weapon */}
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Vũ khí
              </label>
              <div className="segment-control w-full">
                <button
                  className={`flex-1 text-xs ${weaponRarity === 4 ? "active" : ""}`}
                  onClick={() => { setWeaponRarity(4); emit({ weaponRarity: 4 }); playClickSound(); }}
                  type="button"
                >
                  <span className="text-purple-400">4★</span>
                </button>
                <button
                  className={`flex-1 text-xs ${weaponRarity === 5 ? "active" : ""}`}
                  onClick={() => { setWeaponRarity(5); emit({ weaponRarity: 5 }); playClickSound(); }}
                  type="button"
                >
                  <span className="text-amber-400">5★</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function costColor(cost: number) {
  if (cost === 0) return "text-slate-500";
  if (cost <= 2) return "text-cyan-300";
  if (cost <= 4) return "text-amber-300";
  return "text-rose-300";
}

function costDotColor(cost: number) {
  if (cost === 0) return "bg-slate-600";
  if (cost <= 2) return "bg-cyan-400";
  if (cost <= 4) return "bg-amber-400";
  return "bg-rose-400";
}
