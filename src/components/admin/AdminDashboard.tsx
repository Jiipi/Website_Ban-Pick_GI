"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Trophy, Activity, BarChart3, Crown, Shield } from "lucide-react";
import { AdminCreateRefereeForm } from "@/components/AdminCreateRefereeForm";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
};

type Tournament = {
  id: string;
  slug: string;
  name: string;
  status: string;
  format: string;
  maxTeams: number;
  participantCount: number;
  organizerName: string | null;
  createdAt: string;
};

type Health = {
  overall: string;
  components: { id: string; name: string; status: string }[];
  metrics: {
    totalRooms: number;
    activeRooms: number;
    totalTournaments: number;
    onlinePlayers: number;
    totalUsers: number;
  };
} | null;

type Tab = "overview" | "users" | "tournaments";

export function AdminDashboard({
  currentUserId,
  users,
  tournaments,
  health,
}: {
  currentUserId: string;
  users: User[];
  tournaments: Tournament[];
  health: Health;
}) {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="space-y-5 animate-fade-in-up delay-100">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")} icon={<BarChart3 size={14} />}>
          Tổng quan
        </TabButton>
        <TabButton active={tab === "users"} onClick={() => setTab("users")} icon={<Users size={14} />}>
          Users ({users.length})
        </TabButton>
        <TabButton active={tab === "tournaments"} onClick={() => setTab("tournaments")} icon={<Trophy size={14} />}>
          Giải đấu ({tournaments.length})
        </TabButton>
      </div>

      {tab === "overview" && <OverviewTab users={users} tournaments={tournaments} health={health} />}
      {tab === "users" && <UsersTab users={users} currentUserId={currentUserId} />}
      {tab === "tournaments" && <TournamentsTab tournaments={tournaments} />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
        active
          ? "bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40"
          : "bg-slate-800/40 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function OverviewTab({ users, tournaments, health }: { users: User[]; tournaments: Tournament[]; health: Health }) {
  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const refereeCount = users.filter((u) => u.role === "REFEREE").length;
  const ongoingTournaments = tournaments.filter((t) => t.status === "ONGOING").length;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tổng users" value={users.length} sub={`${adminCount} admin · ${refereeCount} referee`} accent="amber" />
        <StatCard label="Giải đấu" value={tournaments.length} sub={`${ongoingTournaments} đang diễn ra`} accent="violet" />
        <StatCard label="Phòng đang chạy" value={health?.metrics.activeRooms ?? 0} sub={`${health?.metrics.totalRooms ?? 0} tổng`} accent="cyan" />
        <StatCard label="Online" value={health?.metrics.onlinePlayers ?? 0} sub="player đang online" accent="emerald" />
      </div>

      <section className="glass-strong rounded-2xl p-5 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-200">
          <Activity size={14} className="text-emerald-300" />
          Trạng thái hệ thống
        </h2>
        {health ? (
          <div className="space-y-2">
            {health.components.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-slate-700/40 bg-slate-900/40 px-4 py-2.5">
                <span className="text-sm text-slate-200">{c.name}</span>
                <StatusPill status={c.status} />
              </div>
            ))}
            <Link href="/status" className="block pt-2 text-center text-[11px] font-bold text-cyan-300 hover:text-cyan-200">
              Xem chi tiết →
            </Link>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Không tải được trạng thái</p>
        )}
      </section>
    </div>
  );
}

function UsersTab({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  return (
    <div className="space-y-5">
      <AdminCreateRefereeForm />

      <section className="glass-strong rounded-2xl overflow-hidden">
        <div className="border-b border-slate-700/40 px-5 py-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">
            Danh sách ({users.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/30">
                <th className="px-5 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Email</th>
                <th className="px-5 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Tên</th>
                <th className="px-5 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Role</th>
                <th className="px-5 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Ngày tạo</th>
                <th className="px-5 py-2.5 text-right text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserRow key={u.id} user={u} isCurrentUser={u.id === currentUserId} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function UserRow({ user, isCurrentUser }: { user: User; isCurrentUser: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function changeRole(newRole: string) {
    if (!confirm(`Đổi role của ${user.email} thành ${newRole}?`)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.message ?? "Đổi role thất bại");
      } else {
        router.refresh();
      }
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="border-b border-slate-800/40 hover:bg-slate-800/20">
      <td className="px-5 py-2.5 font-mono text-xs text-slate-200">{user.email}</td>
      <td className="px-5 py-2.5 text-slate-300">{user.name ?? "—"}</td>
      <td className="px-5 py-2.5">
        <span className={`flex w-fit items-center gap-1 rounded px-2 py-0.5 text-[10px] font-black ${
          user.role === "ADMIN" ? "bg-amber-500/15 text-amber-300" : "bg-cyan-500/15 text-cyan-300"
        }`}>
          {user.role === "ADMIN" ? <Crown size={10} /> : <Shield size={10} />}
          {user.role}
        </span>
      </td>
      <td className="px-5 py-2.5 text-xs text-slate-500">{new Date(user.createdAt).toLocaleString("vi-VN")}</td>
      <td className="px-5 py-2.5 text-right">
        {isCurrentUser ? (
          <span className="text-[10px] text-slate-500 italic">— bạn —</span>
        ) : (
          <div className="flex justify-end gap-1">
            {user.role !== "ADMIN" && (
              <button
                onClick={() => changeRole("ADMIN")}
                disabled={busy}
                className="rounded bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-300 hover:bg-amber-500/25 transition-colors"
              >
                → Admin
              </button>
            )}
            {user.role !== "REFEREE" && (
              <button
                onClick={() => changeRole("REFEREE")}
                disabled={busy}
                className="rounded bg-cyan-500/15 px-2 py-1 text-[10px] font-bold text-cyan-300 hover:bg-cyan-500/25 transition-colors"
              >
                → Referee
              </button>
            )}
          </div>
        )}
        {error && <p className="mt-1 text-[10px] text-rose-300">{error}</p>}
      </td>
    </tr>
  );
}

function TournamentsTab({ tournaments }: { tournaments: Tournament[] }) {
  if (tournaments.length === 0) {
    return (
      <div className="glass-strong rounded-2xl py-12 text-center">
        <p className="text-3xl">🏆</p>
        <p className="mt-2 text-sm text-slate-400">Chưa có giải đấu nào</p>
      </div>
    );
  }

  return (
    <section className="glass-strong rounded-2xl overflow-hidden">
      <div className="border-b border-slate-700/40 px-5 py-3">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">
          Giải đấu ({tournaments.length})
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/30">
              <th className="px-5 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Tên</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Format</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Status</th>
              <th className="px-5 py-2.5 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Đội</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Organizer</th>
              <th className="px-5 py-2.5 text-right text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {tournaments.map((t) => (
              <tr key={t.id} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                <td className="px-5 py-2.5">
                  <p className="font-bold text-slate-200">{t.name}</p>
                  <p className="font-mono text-[10px] text-slate-500">{t.slug}</p>
                </td>
                <td className="px-5 py-2.5 font-mono text-[10px] text-slate-400">{t.format}</td>
                <td className="px-5 py-2.5"><StatusPill status={t.status} /></td>
                <td className="px-5 py-2.5 text-center font-mono tabular-nums text-slate-300">
                  {t.participantCount}/{t.maxTeams}
                </td>
                <td className="px-5 py-2.5 text-xs text-slate-400">{t.organizerName ?? "—"}</td>
                <td className="px-5 py-2.5 text-right">
                  <Link
                    href={`/tournaments/${t.slug}`}
                    className="text-[10px] font-bold text-cyan-300 hover:text-cyan-200"
                  >
                    Xem →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number;
  sub?: string;
  accent: "amber" | "violet" | "cyan" | "emerald";
}) {
  const colorMap = {
    amber: "text-amber-300 bg-amber-500/10",
    violet: "text-violet-300 bg-violet-500/10",
    cyan: "text-cyan-300 bg-cyan-500/10",
    emerald: "text-emerald-300 bg-emerald-500/10",
  };
  return (
    <div className="glass-strong rounded-2xl p-4">
      <div className={`mb-2 inline-flex h-2 items-center rounded-full px-2 ${colorMap[accent]}`} />
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 font-mono text-3xl font-black tabular-nums text-slate-100">{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-slate-500">{sub}</p>}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    operational: { label: "OK", cls: "bg-emerald-500/15 text-emerald-300" },
    degraded: { label: "DEGRADED", cls: "bg-amber-500/15 text-amber-300" },
    outage: { label: "OUTAGE", cls: "bg-rose-500/15 text-rose-300" },
    UPCOMING: { label: "Sắp tới", cls: "bg-cyan-500/15 text-cyan-300" },
    ONGOING: { label: "Đang chạy", cls: "bg-amber-500/15 text-amber-300" },
    FINISHED: { label: "Đã kết thúc", cls: "bg-slate-600/30 text-slate-300" },
    CANCELLED: { label: "Đã huỷ", cls: "bg-rose-500/15 text-rose-300" },
  };
  const c = map[status] ?? { label: status, cls: "bg-slate-700/40 text-slate-300" };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${c.cls}`}>
      {c.label}
    </span>
  );
}
