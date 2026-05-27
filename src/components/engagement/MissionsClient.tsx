"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Swords,
  Trophy,
  Hammer,
  Activity,
  Award,
  UserPlus,
  Clock,
  CheckCircle2,
} from "lucide-react";

type Mission = {
  id: string;
  name: string;
  description: string;
  period: "daily" | "weekly";
  target: number;
  metric: string;
  rewardLabel: string;
  icon: string;
  current: number;
  completed: boolean;
  percent: number;
  resetAt: number;
};

type Data = {
  missions: Mission[];
  summary: { dailyDone: number; dailyTotal: number; weeklyDone: number; weeklyTotal: number };
};

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  Swords,
  Trophy,
  Hammer,
  Activity,
  Award,
  UserPlus,
};

export function MissionsClient() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/missions");
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(body.message ?? "Không tải được nhiệm vụ");
        } else {
          setData(body);
        }
      } catch {
        if (!cancelled) setError("Lỗi kết nối");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="glass-strong rounded-3xl py-16 text-center animate-fade-in-up delay-100">
        <p className="text-sm text-slate-400">Đang tải...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-strong rounded-3xl py-16 text-center animate-fade-in-up delay-100">
        <p className="text-3xl">🔒</p>
        <p className="mt-3 font-bold text-slate-300">Cần đăng ký UID</p>
        <p className="mt-1 text-sm text-slate-500">{error || "Vào sảnh chờ và đăng ký UID để xem nhiệm vụ."}</p>
        <Link href="/lobby" className="btn-primary mt-4">Vào sảnh chờ</Link>
      </div>
    );
  }

  const daily = data.missions.filter((m) => m.period === "daily");
  const weekly = data.missions.filter((m) => m.period === "weekly");

  return (
    <div className="space-y-6 animate-fade-in-up delay-100">
      {/* Daily section */}
      <Section
        title="Nhiệm vụ ngày"
        accent="cyan"
        done={data.summary.dailyDone}
        total={data.summary.dailyTotal}
        resetAt={daily[0]?.resetAt ?? 0}
        missions={daily}
      />

      {/* Weekly section */}
      <Section
        title="Nhiệm vụ tuần"
        accent="violet"
        done={data.summary.weeklyDone}
        total={data.summary.weeklyTotal}
        resetAt={weekly[0]?.resetAt ?? 0}
        missions={weekly}
      />

      <div className="rounded-2xl border border-slate-700/40 bg-slate-900/40 px-4 py-3 text-xs text-slate-400">
        <p>
          <strong className="text-slate-300">Lưu ý:</strong> EXP hiện tại chỉ là biểu tượng, sẽ kích hoạt khi hệ thống level ra mắt.
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  accent,
  done,
  total,
  resetAt,
  missions,
}: {
  title: string;
  accent: "cyan" | "violet";
  done: number;
  total: number;
  resetAt: number;
  missions: Mission[];
}) {
  const accentText = accent === "cyan" ? "text-cyan-300" : "text-violet-300";
  const accentBg = accent === "cyan" ? "from-cyan-500/15 to-cyan-500/5" : "from-violet-500/15 to-violet-500/5";

  return (
    <section className="glass-strong rounded-3xl p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className={`text-sm font-black uppercase tracking-wider ${accentText}`}>{title}</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Hoàn thành <span className="font-mono font-bold text-slate-200">{done}</span> / {total}
          </p>
        </div>
        {resetAt > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <Clock size={12} />
            <span>Reset sau {timeUntil(resetAt)}</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-800/60">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${accentBg.replace("/15", "/100").replace("/5", "/50")} transition-all`}
          style={{
            width: `${total > 0 ? Math.round((done / total) * 100) : 0}%`,
            background:
              accent === "cyan"
                ? "linear-gradient(to right, #22d3ee, #67e8f9)"
                : "linear-gradient(to right, #a78bfa, #c4b5fd)",
          }}
        />
      </div>

      <div className="space-y-2">
        {missions.map((m) => (
          <MissionRow key={m.id} mission={m} />
        ))}
      </div>
    </section>
  );
}

function MissionRow({ mission }: { mission: Mission }) {
  const Icon = ICONS[mission.icon] ?? Activity;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
        mission.completed
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-slate-700/40 bg-slate-900/40"
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          mission.completed ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-800/60 text-slate-400"
        }`}
      >
        {mission.completed ? <CheckCircle2 size={16} /> : <Icon size={16} />}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-bold ${
            mission.completed ? "text-emerald-200" : "text-slate-200"
          } truncate`}
        >
          {mission.name}
        </p>
        <p className="text-[11px] text-slate-400 truncate">{mission.description}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-800/60">
            <div
              className={`h-full rounded-full transition-all ${
                mission.completed
                  ? "bg-emerald-400"
                  : "bg-gradient-to-r from-cyan-400 to-violet-400"
              }`}
              style={{ width: `${mission.percent}%` }}
            />
          </div>
          <span className="font-mono text-[10px] tabular-nums text-slate-400 shrink-0">
            {mission.current}/{mission.target}
          </span>
        </div>
      </div>
      <div className="shrink-0 rounded-lg bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-200">
        {mission.rewardLabel}
      </div>
    </div>
  );
}

function timeUntil(epochMs: number): string {
  const diff = epochMs - Date.now();
  if (diff <= 0) return "vừa reset";
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
