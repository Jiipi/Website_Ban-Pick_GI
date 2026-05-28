import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Maximize2, UserPlus } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { BracketView } from "@/components/tournaments/BracketView";
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
    title: result.ok ? `Bracket ${result.data.tournament.name}` : "Tournament bracket",
  };
}

export default async function TournamentBracketPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await services.tournament.getTournament(slug);
  if (!result.ok) notFound();

  const { tournament, participants, matches } = result.data;
  const user = await services.auth.getCurrentUserRecord();
  const isOrganizer = Boolean(user && tournament.organizerId === user.id);

  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-6">
        <div className="mx-auto max-w-[1600px] space-y-4">
          <div className="glass-strong rounded-3xl px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                  <Maximize2 size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-400">Fullscreen bracket</p>
                  <h1 className="text-xl font-black text-slate-100">{tournament.name}</h1>
                </div>
              </div>
              <div className="flex gap-2">
                {tournament.status === "UPCOMING" && (
                  <Link href={`/tournaments/${tournament.slug}/register`} className="btn-primary">
                    <UserPlus size={14} />
                    Dang ky
                  </Link>
                )}
                <Link href={`/tournaments/${tournament.slug}`} className="btn-outline">
                  <ArrowLeft size={14} />
                  Chi tiet
                </Link>
              </div>
            </div>
          </div>

          <section className="glass-strong min-h-[72vh] rounded-3xl p-4">
            {matches.length === 0 ? (
              <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                <p className="text-3xl">Bracket</p>
                <p className="mt-2 text-sm text-slate-400">
                  Bracket chua duoc tao. Organizer tao bracket tu trang chi tiet giai dau.
                </p>
              </div>
            ) : (
              <BracketView matches={matches} participants={participants} isOrganizer={isOrganizer} />
            )}
          </section>
        </div>
      </main>
    </>
  );
}
