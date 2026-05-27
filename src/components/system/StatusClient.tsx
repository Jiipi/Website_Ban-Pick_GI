"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, Clock, Database, Users, Trophy, Server } from "lucide-react";

type ComponentStatus = "operational" | "degraded" | "outage";

type HealthComponent = {
  id: string;
  name: string;
  status: ComponentStatus;
  message: string;
  latencyMs: number | null;
};

type Health = {
  overall: ComponentStatus;
  uptimeSeconds: number;
  components: HealthComponent[];
  metrics: {
    totalRooms: number;
    activeRooms: number;
    totalTournaments: number;
    onlinePlayers: number;
    totalUsers: number;
  };
  timestamp: string;
};

export function StatusClient() {
  const [data, setData] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/status");
      const body = await res.json();
      if (!res.ok) {
        setError(body.message ?? "Không tải được trạng thái");
      } else {
        setData(body);
      }
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  if (loading && !data) {
    return (
      <div className="glass-strong rounded-3xl py-16 text-center animate-fade-in-up delay-100">
        <p className="text-sm text-slate-400">Đang kiểm tra trạng thái...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-strong rounded-3xl py-16 text-center animate-fade-in-up delay-100">
        <p className="text-3xl">⚠️</p>
        <p className="mt-3 font-bold text-slate-300">Không tải được trạng thái</p>
        <p className="mt-1 text-sm text-slate-500">{error}</p>
      </div>
    );
  }

  const overall = STATUS_META[data.overall];

  return (
    <div className="space-y-5 animate-fade-in-up delay-100">
      {/* Overall banner */}
      <div className={`glass-strong rounded-3xl p-6 sm:p-7 ring-1 ${overall.ring}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${overall.bg} ${overall.text}`}>
              <overall.Icon size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Trạng thái tổng</p>
              <p className={`text-2xl font-black ${overall.text}`}>{overall.label}</p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800/40 px-3 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800/70 hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
          <Clock size={12} />
          <span>Uptime: <span className="font-mono text-slate-300">{formatUptime(data.uptimeSeconds)}</span></span>
          <span className="text-slate-700">·</span>
          <span>Cập nhật: <span className="font-mono text-slate-300">{new Date(data.timestamp).toLocaleTimeString("vi-VN")}</span></span>
        </div>
      </div>

      {/* Components */}
      <section className="glass-strong rounded-2xl p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-200">Thành phần hệ thống</h2>
        <div className="space-y-2">
          {data.components.map((c) => (
            <ComponentRow key={c.id} component={c} />
          ))}
        </div>
      </section>

      {/* Metrics */}
      <section className="glass-strong rounded-2xl p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-200">Chỉ số hệ thống</h2>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <MetricCard icon={<Database size={14} />} label="Tổng phòng" value={data.metrics.totalRooms} accent="violet" />
          <MetricCard icon={<Server size={14} />} label="Phòng đang chạy" value={data.metrics.activeRooms} accent="cyan" />
          <MetricCard icon={<Trophy size={14} />} label="Giải đấu" value={data.metrics.totalTournaments} accent="amber" />
          <MetricCard icon={<Users size={14} />} label="Online" value={data.metrics.onlinePlayers} accent="emerald" />
          <MetricCard icon={<Users size={14} />} label="User" value={data.metrics.totalUsers} accent="rose" />
        </div>
      </section>
    </div>
  );
}

function ComponentRow({ component }: { component: HealthComponent }) {
  const meta = STATUS_META[component.status];
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-700/40 bg-slate-900/40 px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.bg} ${meta.text}`}>
          <meta.Icon size={14} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-200 truncate">{component.name}</p>
          <p className="text-[11px] text-slate-500 truncate">{component.message}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {component.latencyMs !== null && (
          <span className="font-mono text-[10px] text-slate-400 tabular-nums">{component.latencyMs}ms</span>
        )}
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${meta.badge}`}>
          {meta.label}
        </span>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: "violet" | "cyan" | "amber" | "emerald" | "rose";
}) {
  const colorMap = {
    violet: "text-violet-300 bg-violet-500/10",
    cyan: "text-cyan-300 bg-cyan-500/10",
    amber: "text-amber-300 bg-amber-500/10",
    emerald: "text-emerald-300 bg-emerald-500/10",
    rose: "text-rose-300 bg-rose-500/10",
  };
  return (
    <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-3">
      <div className={`mb-2 flex h-7 w-7 items-center justify-center rounded-lg ${colorMap[accent]}`}>{icon}</div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 font-mono text-2xl font-black tabular-nums text-slate-100">{value}</p>
    </div>
  );
}

const STATUS_META: Record<ComponentStatus, {
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
  bg: string;
  text: string;
  ring: string;
  badge: string;
}> = {
  operational: {
    label: "Hoạt động",
    Icon: CheckCircle2,
    bg: "bg-emerald-500/15",
    text: "text-emerald-300",
    ring: "ring-emerald-500/30",
    badge: "bg-emerald-500/15 text-emerald-300",
  },
  degraded: {
    label: "Giảm hiệu suất",
    Icon: AlertTriangle,
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    ring: "ring-amber-500/30",
    badge: "bg-amber-500/15 text-amber-300",
  },
  outage: {
    label: "Lỗi",
    Icon: XCircle,
    bg: "bg-rose-500/15",
    text: "text-rose-300",
    ring: "ring-rose-500/30",
    badge: "bg-rose-500/15 text-rose-300",
  },
};

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
