import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trophy, Calendar, Users, Award } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { services } from "@/composition/services";
import { TournamentDetailClient } from "@/components/tournaments/TournamentDetailClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const result = await services.tournament.getTournament(slug);
  if (!result.ok) return { title: "Không tìm thấy giải đấu" };
  return {
    title: `${result.data.tournament.name} — Giải đấu`,
    description: result.data.tournament.description ?? `Giải đấu ${result.data.tournament.name}`,
  };
}

export default async function TournamentDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await services.tournament.getTournament(slug);
  if (!result.ok) notFound();

  const { tournament, participants, matches } = result.data;
  const user = await services.auth.getCurrentUserRecord();
  const isOrganizer = user && tournament.organizerId === user.id;

  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Top nav */}
          <div className="flex items-center justify-between">
            <Link href="/tournaments" className="btn-outline">
              <ArrowLeft size={14} />
              Danh sách giải đấu
            </Link>
            <StatusBadge status={tournament.status} />
          </div>

          {/* Hero */}
          <div className="glass-strong rounded-3xl overflow-hidden animate-fade-in-up">
            {tournament.bannerUrl && (
              <div className="aspect-[3/1] overflow-hidden bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={tournament.bannerUrl} alt={tournament.name} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                  <Trophy size={18} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">
                  {tournament.format === "SINGLE_ELIM" ? "Single Elimination" : tournament.format}
                </p>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-100 sm:text-4xl">
                {tournament.name}
              </h1>
              {tournament.description && (
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{tournament.description}</p>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                <InfoCell icon={<Users size={14} />} label="Số đội" value={`${participants.length}/${tournament.maxTeams}`} />
                <InfoCell
                  icon={<Calendar size={14} />}
                  label="Bắt đầu"
                  value={tournament.startDate ? new Date(tournament.startDate).toLocaleDateString("vi-VN") : "TBD"}
                />
                <InfoCell icon={<Trophy size={14} />} label="Organizer" value={tournament.organizerName ?? "—"} />
                <InfoCell icon={<Award size={14} />} label="Giải thưởng" value={tournament.prizeInfo ?? "—"} />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <InfoCell icon={<Trophy size={14} />} label="Cost cap" value={String(tournament.costCap)} />
                <InfoCell icon={<Trophy size={14} />} label="Bank time" value={`${tournament.bankTime}s`} />
                <InfoCell icon={<Trophy size={14} />} label="Fearless" value={tournament.fearlessDraft ? "On" : "Off"} />
                <InfoCell icon={<Trophy size={14} />} label="Patch/Region" value={`${tournament.patch ?? "TBD"} / ${tournament.region ?? "All"}`} />
              </div>
              {tournament.rulesText && (
                <div className="mt-4 rounded-2xl border border-slate-700/40 bg-slate-900/40 px-4 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Rules</p>
                  <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-300">{tournament.rulesText}</p>
                </div>
              )}
            </div>
          </div>

          <TournamentDetailClient
            tournament={tournament}
            participants={participants}
            matches={matches}
            isOrganizer={Boolean(isOrganizer)}
            isLoggedIn={Boolean(user)}
          />
        </div>
      </main>
    </>
  );
}

function InfoCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-slate-500">
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1 text-sm font-bold text-slate-200 truncate">{value}</p>
    </div>
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
    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${c.cls}`}>
      {c.label}
    </span>
  );
}
