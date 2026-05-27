import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { services } from "@/composition/services";
import { LeaderboardClient } from "@/components/leaderboard/LeaderboardClient";

export const metadata = {
  title: "Bảng xếp hạng — Genshin Ban/Pick",
  description: "Bảng xếp hạng player theo W/L từ các trận đấu La Hoàn Cảnh Giới.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LeaderboardPage() {
  const result = await services.leaderboard.getLeaderboard(50);
  const players = result.ok ? result.data.players : [];

  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="glass-strong rounded-3xl px-6 py-5 sm:px-8 sm:py-6 animate-fade-in-up">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                  <Trophy size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Ranking</p>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">
                    <span className="text-gradient-gold">Bảng Xếp Hạng</span>
                  </h1>
                </div>
              </div>
              <Link href="/" className="btn-outline shrink-0">
                <ArrowLeft size={14} />
                Trang chủ
              </Link>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Top {players.length} player tính theo số trận thắng. Xếp hạng dựa trên các trận đấu đã hoàn tất
              (FINISHED).
            </p>
          </div>

          <LeaderboardClient players={players} />
        </div>
      </main>
    </>
  );
}
