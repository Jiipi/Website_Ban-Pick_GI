import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { TournamentRegisterClient } from "@/components/tournaments/TournamentRegisterClient";
import { services } from "@/composition/services";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const result = await services.tournament.getTournament(slug);
  return {
    title: result.ok ? `Dang ky ${result.data.tournament.name}` : "Dang ky giai dau",
  };
}

export default async function TournamentRegisterPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await services.tournament.getTournament(slug);
  if (!result.ok) notFound();

  const { tournament } = result.data;

  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <Link href={`/tournaments/${tournament.slug}`} className="btn-outline">
              <ArrowLeft size={14} />
              Ve giai dau
            </Link>
          </div>

          <div className="glass-strong rounded-3xl px-6 py-5 sm:px-8 sm:py-6 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                <UserPlus size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Registration</p>
                <h1 className="text-2xl font-black tracking-tight text-slate-100">Dang ky doi thi dau</h1>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              {tournament.name} - {tournament.participantCount}/{tournament.maxTeams} slot da dung.
            </p>
          </div>

          {tournament.status !== "UPCOMING" || tournament.participantCount >= tournament.maxTeams ? (
            <div className="glass-strong rounded-3xl py-16 text-center">
              <p className="text-3xl">Closed</p>
              <p className="mt-3 text-sm text-slate-400">
                Giai dau khong con mo dang ky hoac da du slot.
              </p>
            </div>
          ) : (
            <TournamentRegisterClient
              tournament={{
                slug: tournament.slug,
                name: tournament.name,
                maxTeams: tournament.maxTeams,
                participantCount: tournament.participantCount,
                status: tournament.status,
              }}
            />
          )}
        </div>
      </main>
    </>
  );
}
