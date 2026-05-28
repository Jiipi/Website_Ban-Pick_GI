"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, RotateCcw, Clock, ChevronUp, ChevronDown } from "lucide-react";
import { calculateHandicap } from "@/lib/cost";
import { calculateBuildCost, defaultCostCatalog, type CostCatalog } from "@/domain/cost/CostCatalog";
import { DEFAULT_COST_PER_POINT, MIN_COST_PER_POINT, MAX_COST_PER_POINT } from "@/lib/constants";
import { playClickSound, playConfirmSound } from "@/lib/sounds";

type Slot = {
  id: string;
  rarity: 4 | 5;
  consLevel: number;
  weaponRarity: 4 | 5;
};

type TeamSide = "BLUE" | "RED";

const PICKS_PER_TEAM = 8;

function makeSlot(): Slot {
  return {
    id: crypto.randomUUID(),
    rarity: 5,
    consLevel: 0,
    weaponRarity: 4,
  };
}

function initialTeam(): Slot[] {
  return Array.from({ length: PICKS_PER_TEAM }, () => makeSlot());
}

function slotCost(slot: Slot, catalog: CostCatalog): number {
  return calculateBuildCost(catalog, {
    characterId: "",
    characterRarity: slot.rarity,
    consLevel: slot.consLevel,
    weaponId: null,
    weaponRarity: slot.weaponRarity,
  }).totalCost;
}

export function CostCalculatorClient({ costCatalog = defaultCostCatalog }: { costCatalog?: CostCatalog } = {}) {
  const [blue, setBlue] = useState<Slot[]>(() => initialTeam());
  const [red, setRed] = useState<Slot[]>(() => initialTeam());
  const [costPerPoint, setCostPerPoint] = useState(DEFAULT_COST_PER_POINT);

  const blueCost = useMemo(
    () => blue.reduce((sum, s) => sum + slotCost(s, costCatalog), 0),
    [blue, costCatalog],
  );
  const redCost = useMemo(
    () => red.reduce((sum, s) => sum + slotCost(s, costCatalog), 0),
    [red, costCatalog],
  );
  const handicap = useMemo(() => calculateHandicap(blueCost, redCost, costPerPoint), [blueCost, redCost, costPerPoint]);

  function updateSlot(team: TeamSide, id: string, patch: Partial<Slot>) {
    const setter = team === "BLUE" ? setBlue : setRed;
    setter((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function addSlot(team: TeamSide) {
    const setter = team === "BLUE" ? setBlue : setRed;
    setter((prev) => [...prev, makeSlot()]);
    playClickSound();
  }

  function removeSlot(team: TeamSide, id: string) {
    const setter = team === "BLUE" ? setBlue : setRed;
    setter((prev) => prev.filter((s) => s.id !== id));
    playClickSound();
  }

  function resetAll() {
    setBlue(initialTeam());
    setRed(initialTeam());
    setCostPerPoint(DEFAULT_COST_PER_POINT);
    playConfirmSound();
  }

  return (
    <>
      {/* Settings strip */}
      <div className="glass-strong rounded-2xl px-5 py-4 animate-fade-in-up delay-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-violet-300" />
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Giây / 1 cost
            </label>
            <input
              type="number"
              min={MIN_COST_PER_POINT}
              max={MAX_COST_PER_POINT}
              value={costPerPoint}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v)) setCostPerPoint(Math.min(MAX_COST_PER_POINT, Math.max(MIN_COST_PER_POINT, v)));
              }}
              className="w-20 rounded-lg border border-slate-700/50 bg-slate-900/60 px-3 py-1.5 text-center font-mono text-sm font-bold text-slate-100 focus:border-violet-500/50 focus:outline-none"
            />
            <span className="text-xs text-slate-500">giây</span>
          </div>
          <button onClick={resetAll} type="button" className="btn-outline">
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* Team panels */}
      <div className="grid gap-5 lg:grid-cols-2">
        <TeamPanel
          team="BLUE"
          slots={blue}
          totalCost={blueCost}
          costCatalog={costCatalog}
          onUpdate={(id, patch) => updateSlot("BLUE", id, patch)}
          onAdd={() => addSlot("BLUE")}
          onRemove={(id) => removeSlot("BLUE", id)}
        />
        <TeamPanel
          team="RED"
          slots={red}
          totalCost={redCost}
          costCatalog={costCatalog}
          onUpdate={(id, patch) => updateSlot("RED", id, patch)}
          onAdd={() => addSlot("RED")}
          onRemove={(id) => removeSlot("RED", id)}
        />
      </div>

      {/* Result */}
      <div className="glass-strong rounded-3xl p-6 sm:p-8 animate-fade-in-up delay-300">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 text-center">Kết quả</p>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Đội Xanh</p>
            <p className="mt-1 font-mono text-3xl font-black tabular-nums text-cyan-200">{blueCost}</p>
            <p className="text-[10px] text-slate-500">tổng cost</p>
          </div>
          <div className="border-x border-slate-700/40">
            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-300">Handicap</p>
            <p className="mt-1 font-mono text-3xl font-black tabular-nums text-violet-200">
              {handicap.seconds}
              <span className="text-base text-slate-500">s</span>
            </p>
            <p className="text-[10px] text-slate-500">
              {handicap.penalizedTeam === "NONE"
                ? "Cân bằng"
                : `${handicap.penalizedTeam === "BLUE" ? "Xanh" : "Đỏ"} đi nhanh hơn`}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-300">Đội Đỏ</p>
            <p className="mt-1 font-mono text-3xl font-black tabular-nums text-rose-200">{redCost}</p>
            <p className="text-[10px] text-slate-500">tổng cost</p>
          </div>
        </div>

        {handicap.diff > 0 && (
          <p className="mt-4 text-center text-xs leading-relaxed text-slate-400">
            Chênh lệch <strong className="text-slate-200">{handicap.diff} cost</strong> × <strong className="text-violet-300">{costPerPoint}s/cost</strong> ={" "}
            <strong className="text-violet-200">{handicap.seconds}s</strong>. Đội{" "}
            <strong className={handicap.penalizedTeam === "BLUE" ? "text-cyan-300" : "text-rose-300"}>
              {handicap.penalizedTeam === "BLUE" ? "Xanh" : "Đỏ"}
            </strong>{" "}
            phải hoàn thành La Hoàn nhanh hơn đối thủ {handicap.seconds} giây.
          </p>
        )}
      </div>
    </>
  );
}

function TeamPanel({
  team,
  slots,
  totalCost,
  costCatalog,
  onUpdate,
  onAdd,
  onRemove,
}: {
  team: TeamSide;
  slots: Slot[];
  totalCost: number;
  costCatalog: CostCatalog;
  onUpdate: (id: string, patch: Partial<Slot>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  const teamLabel = team === "BLUE" ? "Đội Xanh" : "Đội Đỏ";
  const accent = team === "BLUE" ? "cyan" : "rose";
  const colorClasses = team === "BLUE"
    ? "border-cyan-500/30 text-cyan-300"
    : "border-rose-500/30 text-rose-300";
  const totalClasses = team === "BLUE" ? "text-cyan-300" : "text-rose-300";

  return (
    <section
      className={`glass-strong rounded-3xl p-5 sm:p-6 animate-fade-in-up delay-200 border ${colorClasses}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-lg font-black tracking-tight ${totalClasses}`}>{teamLabel}</h2>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tổng cost</p>
          <p className={`font-mono text-2xl font-black tabular-nums ${totalClasses}`}>{totalCost}</p>
        </div>
      </div>

      <div className="space-y-2">
        {slots.map((slot, idx) => (
          <SlotRow
            key={slot.id}
            index={idx + 1}
            slot={slot}
            accent={accent}
            costCatalog={costCatalog}
            onUpdate={(patch) => onUpdate(slot.id, patch)}
            onRemove={() => onRemove(slot.id)}
            canRemove={slots.length > 1}
          />
        ))}
      </div>

      <button onClick={onAdd} type="button" className="btn-outline mt-3 w-full">
        <Plus size={14} />
        Thêm slot
      </button>
    </section>
  );
}

function SlotRow({
  index,
  slot,
  accent,
  costCatalog,
  onUpdate,
  onRemove,
  canRemove,
}: {
  index: number;
  slot: Slot;
  accent: "cyan" | "rose";
  costCatalog: CostCatalog;
  onUpdate: (patch: Partial<Slot>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const cost = slotCost(slot, costCatalog);
  const accentText = accent === "cyan" ? "text-cyan-300" : "text-rose-300";

  return (
    <div className="grid grid-cols-[28px_1fr_1fr_1fr_44px_28px] items-center gap-2 rounded-xl border border-slate-700/40 bg-slate-900/40 px-2 py-2">
      <span className="text-center font-mono text-[11px] font-bold text-slate-500">#{index}</span>

      {/* Rarity */}
      <select
        value={slot.rarity}
        onChange={(e) => onUpdate({ rarity: Number(e.target.value) as 4 | 5 })}
        className="rounded border border-slate-700/40 bg-slate-900/60 px-2 py-1 text-xs font-bold text-slate-200 focus:border-cyan-500/40 focus:outline-none"
      >
        <option value={5}>5★ char</option>
        <option value={4}>4★ char</option>
      </select>

      {/* Cons stepper */}
      <ConsStepper
        rarity={slot.rarity}
        consLevel={slot.consLevel}
        onChange={(consLevel) => onUpdate({ consLevel })}
      />

      {/* Weapon */}
      <select
        value={slot.weaponRarity}
        onChange={(e) => onUpdate({ weaponRarity: Number(e.target.value) as 4 | 5 })}
        className="rounded border border-slate-700/40 bg-slate-900/60 px-2 py-1 text-xs font-bold text-slate-200 focus:border-cyan-500/40 focus:outline-none"
      >
        <option value={4}>4★ wpn</option>
        <option value={5}>5★ wpn</option>
      </select>

      {/* Cost */}
      <span className={`text-center font-mono text-sm font-black tabular-nums ${accentText}`}>{cost}</span>

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label="Xoá slot"
        className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-rose-500/10 hover:text-rose-300 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

function ConsStepper({
  rarity,
  consLevel,
  onChange,
}: {
  rarity: 4 | 5;
  consLevel: number;
  onChange: (n: number) => void;
}) {
  const inc = () => onChange(Math.min(6, consLevel + 1));
  const dec = () => onChange(Math.max(0, consLevel - 1));
  const disabled = rarity === 4; // 4★ cons không tính cost, vẫn cho chỉnh nhưng UI hint

  return (
    <div className="flex items-center justify-between rounded border border-slate-700/40 bg-slate-900/60 px-1.5 py-0.5">
      <button
        type="button"
        onClick={dec}
        disabled={consLevel === 0}
        aria-label="Giảm cons"
        className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:text-cyan-300 disabled:opacity-30"
      >
        <ChevronDown size={12} />
      </button>
      <span
        className={`font-mono text-xs font-black ${disabled ? "text-slate-500" : "text-slate-200"}`}
        title={disabled ? "4★: cons không cộng cost" : undefined}
      >
        C{consLevel}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={consLevel === 6}
        aria-label="Tăng cons"
        className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:text-cyan-300 disabled:opacity-30"
      >
        <ChevronUp size={12} />
      </button>
    </div>
  );
}
