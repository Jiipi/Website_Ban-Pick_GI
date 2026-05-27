import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { FriendsClient } from "@/components/social/FriendsClient";

export const metadata = {
  title: "Bạn bè — Genshin Ban/Pick",
  description: "Quản lý danh sách bạn bè, lời mời kết bạn.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FriendsPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="glass-strong rounded-3xl px-6 py-5 sm:px-8 sm:py-6 animate-fade-in-up">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                  <Users size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Social</p>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">Bạn bè</h1>
                </div>
              </div>
              <Link href="/" className="btn-outline shrink-0">
                <ArrowLeft size={14} />
                Trang chủ
              </Link>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Kết bạn với những người chơi khác để theo dõi hoạt động và mời tham gia trận đấu.
            </p>
          </div>

          <FriendsClient />
        </div>
      </main>
    </>
  );
}
