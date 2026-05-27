"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Swords,
  Trophy,
  Crown,
  Award,
  Calendar,
  UserPlus,
  Users,
  Palette,
  Target,
  Lock,
} from "lucide-react";

type Tier = "bronze" | "silver" | "gold" | "platinum";

type Achievement = {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: Tier;
  target: number;
  metric: string;
  icon: string;
  current: number;
  unlocked: boolean;
  percent: number;
};

type Data = {
  achievements: Achievement[];
  summary: { total: number; unlocked: number; percent: number };
};

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  Sparkles,
  Swords,
  Trophy,
  Crown,
  Award,
  Calendar,
  UserPlus,
  Users,
  Palette,
  Target,
};

const CATEGORIES = [
  { key: "all", label: "Tất cả" },
  { key: "matches", label: "Trận đấu" },
  { key: "wins", label: "Thắng" },
  { key: "tournament", label: "Giải đấu" },
  { key: "social", label: "Xã hội" },
  { key: "exploration", label: "Khám phá" },
];

export function AchievementsClient() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/achievements");
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(body.message ?? "Không tải được thành tựu");
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
        <p className="mt-1 text-sm text-slate-500">{error || "Vào sảnh chờ và đăng ký UID để xem thành tựu."}</p>
        <Link href="/lobby" className="btn-primary mt-4">Vào sảnh chờ</Link>
      </div>
    );
  }

  const list = filter === "all" ? data.achievements : data.achievements.filter((a) => a.category === filter);

  return (
    <div className="space-y-5 animate-fade-in-up delay-100">
      {/* Summary */}
      <div className="glass-strong rounded-3xl p-6 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tiến trình</p>
            <p className="mt-1 font-mono text-3xl font-black tabular-nums text-slate-100">
              {data.summary.unlocked} / {data.summary.total}
            </p>
            <p className="mt-1 text-xs text-slate-500">{data.summary.percent}% hoàn thành</p>
          </div>
          <div className="text-5xl">🏅</div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 transition-all"
            style={{ width: `${data.summary.percent}%` }}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setFilter(cat.key)}
            className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              filter === cat.key
                ? "bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40"
                : "bg-slate-800/40 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {list.length === 0 ? (
        <div className="glass-strong rounded-3xl py-16 text-center">
          <p className="text-3xl">🏆</p>
          <p className="mt-3 text-sm text-slate-400">Không có thành tựu nào ở mục này.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <AchievementCard key={a.id} achievement={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const Icon = ICONS[achievement.icon] ?? Sparkles;
  const tierStyle = TIER_STYLES[achievement.tier];

  return (
    <div
      className={`glass-strong rounded-2xl p-4 transition-all ${
        achievement.unlocked
          ? `${tierStyle.ring} ring-1`
          : "ring-1 ring-slate-800/40 opacity-80"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            achievement.unlocked ? tierStyle.bg : "bg-slate-800/60"
          } ${achievement.unlocked ? tierStyle.text : "text-slate-600"}`}
        >
          {achievement.unlocked ? <Icon size={20} /> : <Lock size={16} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p
              className={`text-sm font-black ${
                achievement.unlocked ? "text-slate-100" : "text-slate-400"
              } truncate`}
            >
              {achievement.name}
            </p>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${tierStyle.badge}`}
            >
              {achievement.tier}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-2">{achievement.description}</p>

          {/* Progress */}
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800/60">
              <div
                className={`h-full rounded-full transition-all ${
                  achievement.unlocked
                    ? "bg-gradient-to-r from-amber-400 to-yellow-200"
                    : "bg-gradient-to-r from-slate-600 to-slate-500"
                }`}
                style={{ width: `${achievement.percent}%` }}
              />
            </div>
            <span className="font-mono text-[10px] tabular-nums text-slate-400">
              {achievement.current}/{achievement.target}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const TIER_STYLES: Record<Tier, { ring: string; bg: string; text: string; badge: string }> = {
  bronze: {
    ring: "ring-amber-700/40",
    bg: "bg-amber-700/15",
    text: "text-amber-500",
    badge: "bg-amber-700/20 text-amber-300",
  },
  silver: {
    ring: "ring-slate-400/40",
    bg: "bg-slate-400/15",
    text: "text-slate-200",
    badge: "bg-slate-400/20 text-slate-200",
  },
  gold: {
    ring: "ring-amber-400/40",
    bg: "bg-amber-400/15",
    text: "text-amber-200",
    badge: "bg-amber-400/20 text-amber-100",
  },
  platinum: {
    ring: "ring-cyan-300/40",
    bg: "bg-cyan-300/15",
    text: "text-cyan-200",
    badge: "bg-cyan-300/20 text-cyan-100",
  },
};
