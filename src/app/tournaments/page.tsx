import Link from "next/link";
import { ArrowLeft, Trophy, Plus, Users, Calendar } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { services } from "@/composition/services";

export const metadata = {
  title: "Giải đấu — Genshin Ban/Pick",
  description: "Danh sách giải đấu La Hoàn Cảnh Giới.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_TABS = [
  { key: "all", label: "Tất cả" },
  { key: "UPCOMING", label: "Sắp tới" },
  { key: "ONGOING", label: "Đang diễn ra" },
  { key: "FINISHED", label: "Đã kết thúc" },
] as const;

export default async function TournamentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = status && STATUS_TABS.some((t) => t.key === status) ? status : "all";

  const result = await services.tournament.listTournaments(
    filter === "all" ? {} : { status: filter },
  );
  const tournaments = result.ok ? result.data.tournaments : [];
  const user = await services.auth.getCurrentUserRecord();

  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Header */}
          <div className="glass-strong rounded-3xl px-6 py-5 sm:px-8 sm:py-6 animate-fade-in-up">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                  <Trophy size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Tournaments</p>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">Giải đấu</h1>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/" className="btn-outline">
                  <ArrowLeft size={14} />
                  Trang chủ
                </Link>
                {user && (
                  <Link href="/tournaments/create" className="btn-primary">
                    <Plus size={14} />
                    Tạo giải mới
                  </Link>
                )}
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Tổ chức và tham gia các giải đấu Single Elimination cho La Hoàn Cảnh Giới. Có{" "}
              <strong className="text-slate-200">{tournaments.length}</strong> giải.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 animate-fade-in-up delay-100">
            {STATUS_TABS.map((tab) => {
              const active = filter === tab.key;
              return (
                <Link
                  key={tab.key}
                  href={tab.key === "all" ? "/tournaments" : `/tournaments?status=${tab.key}`}
                  className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                    active
                      ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/40"
                      : "bg-slate-800/40 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {/* Grid */}
          {tournaments.length === 0 ? (
            <div className="glass-strong rounded-3xl py-16 text-center animate-fade-in-up delay-200">
              <p className="text-4xl">🎮</p>
              <p className="mt-3 font-bold text-slate-300">Chưa có giải đấu nào</p>
              <p className="mt-1 text-sm text-slate-500">
                {user ? "Tạo giải đấu đầu tiên của bạn ngay!" : "Đăng nhập để tạo giải đấu."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up delay-200">
              {tournaments.map((t) => (
                <Link
                  key={t.id}
                  href={`/tournaments/${t.slug}`}
                  className="group glass-strong rounded-2xl overflow-hidden hover:ring-1 hover:ring-violet-500/40 transition-all"
                >
                  {/* Banner */}
                  <div className="aspect-[2/1] overflow-hidden bg-gradient-to-br from-violet-500/20 via-cyan-500/10 to-rose-500/20 relative">
                    {t.bannerUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.bannerUrl} alt={t.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Trophy size={48} className="text-slate-700" />
                      </div>
                    )}
                    <StatusBadge status={t.status} />
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-wider text-violet-300/70">
                        {t.format === "SINGLE_ELIM" ? "Single Elimination" : t.format}
                      </p>
                      <h2 className="text-base font-black text-slate-100 truncate group-hover:text-violet-300 transition-colors">
                        {t.name}
                      </h2>
                      {t.description && (
                        <p className="mt-1 text-xs text-slate-400 line-clamp-2">{t.description}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Users size={12} className="text-slate-500" />
                        <span className="font-mono">{t.participantCount}/{t.maxTeams}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-500" />
                        <span className="font-mono text-[10px]">
                          {t.startDate ? new Date(t.startDate).toLocaleDateString("vi-VN") : "TBD"}
                        </span>
                      </div>
                    </div>

                    {t.organizerName && (
                      <p className="text-[10px] text-slate-500 truncate">Organizer: {t.organizerName}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    UPCOMING: { label: "Sắp tới", cls: "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-500/40" },
    ONGOING: { label: "Đang diễn ra", cls: "bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40" },
    FINISHED: { label: "Đã kết thúc", cls: "bg-slate-600/30 text-slate-300 ring-1 ring-slate-500/40" },
    CANCELLED: { label: "Đã huỷ", cls: "bg-rose-500/20 text-rose-200 ring-1 ring-rose-500/40" },
  };
  const c = config[status] ?? config.UPCOMING;
  return (
    <span className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${c.cls}`}>
      {c.label}
    </span>
  );
}
