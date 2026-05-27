"use client";

import { CountUp } from "./CountUp";

type ResultScoreBoardProps = {
  blueCost: number;
  redCost: number;
  blueBuildCount: number;
  redBuildCount: number;
  handicapDiff: number;
  handicapSeconds: number;
  penalizedTeam: "BLUE" | "RED" | "NONE";
  costPerPoint: number;
};

export function ResultScoreBoard({
  blueCost,
  redCost,
  blueBuildCount,
  redBuildCount,
  handicapDiff,
  handicapSeconds,
  penalizedTeam,
  costPerPoint,
}: ResultScoreBoardProps) {
  const winner =
    resetPenalizedTeam(blueCost, redCost, penalizedTeam);

  return (
    <div className="grid grid-cols-3 items-stretch gap-3" data-export-card>
      {/* Blue */}
      <div className={`panel-blue flex flex-col items-center justify-center rounded-2xl p-5 relative overflow-hidden ${winner === "BLUE" ? "border-glow-cyan" : ""}`}>
        {winner === "BLUE" && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl animate-float">
            👑
          </div>
        )}
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300">Đội Xanh</p>
        <p className="mt-2 text-5xl font-black tabular-nums text-slate-50 sm:text-6xl">
          <CountUp target={blueCost} />
        </p>
        <p className="mt-2 text-xs text-slate-400">{blueBuildCount}/8 builds</p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 transition-all duration-1000"
            style={{ width: `${Math.min((blueCost / Math.max(blueCost, redCost, 1)) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* VS / Handicap */}
      <div className="glass-strong flex flex-col items-center justify-center rounded-2xl p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Chênh lệch</p>
        <div className="relative mt-2">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 sm:h-24 sm:w-24 animate-float">
            <span className="text-4xl font-black tabular-nums text-amber-300 sm:text-5xl">
              <CountUp target={handicapDiff} />
            </span>
          </div>
        </div>
        <div className="mt-3 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-center">
          {penalizedTeam === "NONE" ? (
            <p className="text-sm font-bold text-emerald-300">⚖️ Cân bằng — Không phạt</p>
          ) : (
            <>
              <p className={`text-xs font-bold ${penalizedTeam === "BLUE" ? "text-cyan-300" : "text-rose-300"}`}>
                {penalizedTeam === "BLUE" ? "Đội Xanh" : "Đội Đỏ"} phải nhanh hơn
              </p>
              <p className="mt-0.5 text-xl font-black tabular-nums text-amber-300">
                ⏱️ <CountUp target={handicapSeconds} />s
              </p>
            </>
          )}
        </div>
      </div>

      {/* Red */}
      <div className={`panel-red flex flex-col items-center justify-center rounded-2xl p-5 relative overflow-hidden ${winner === "RED" ? "border-glow-rose" : ""}`}>
        {winner === "RED" && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl animate-float">
            👑
          </div>
        )}
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-rose-300">Đội Đỏ</p>
        <p className="mt-2 text-5xl font-black tabular-nums text-slate-50 sm:text-6xl">
          <CountUp target={redCost} />
        </p>
        <p className="mt-2 text-xs text-slate-400">{redBuildCount}/8 builds</p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-400 to-pink-500 transition-all duration-1000"
            style={{ width: `${Math.min((redCost / Math.max(blueCost, redCost, 1)) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function resetPenalizedTeam(blueCost: number, redCost: number, penalizedTeam: "BLUE" | "RED" | "NONE"): "BLUE" | "RED" | null {
  if (penalizedTeam !== "NONE") return penalizedTeam;
  if (blueCost === redCost) return null;
  return null;
}
