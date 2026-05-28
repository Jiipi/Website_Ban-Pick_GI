import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { services } from "@/composition/services";
import { CreateTournamentClient } from "@/components/tournaments/CreateTournamentClient";

export const metadata = {
  title: "Tạo giải đấu — Genshin Ban/Pick",
  description: "Tạo giải đấu mới Single Elimination.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CreateTournamentPage() {
  const user = await services.auth.getCurrentUserRecord();
  if (!user) redirect("/login?next=/tournaments/create");
  if (user.role !== "ADMIN") redirect("/tournaments");

  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Header */}
          <div className="glass-strong rounded-3xl px-6 py-5 sm:px-8 sm:py-6 animate-fade-in-up">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                  <Plus size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Tournament</p>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">Tạo giải đấu mới</h1>
                </div>
              </div>
              <Link href="/tournaments" className="btn-outline shrink-0">
                <ArrowLeft size={14} />
                Quay lại
              </Link>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Tạo một giải đấu Single Elimination. Bạn sẽ là organizer và quản lý các trận đấu.
            </p>
          </div>

          <CreateTournamentClient organizerName={user.name ?? user.email} />
        </div>
      </main>
    </>
  );
}
