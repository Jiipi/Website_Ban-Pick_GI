import Link from "next/link";
import { ArrowLeft, Target } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { MissionsClient } from "@/components/engagement/MissionsClient";

export const metadata = {
  title: "Nhiệm vụ — Genshin Ban/Pick",
  description: "Nhiệm vụ ngày và nhiệm vụ tuần.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MissionsPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Header */}
          <div className="glass-strong rounded-3xl px-6 py-5 sm:px-8 sm:py-6 animate-fade-in-up">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                  <Target size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Missions</p>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">Nhiệm vụ</h1>
                </div>
              </div>
              <Link href="/" className="btn-outline shrink-0">
                <ArrowLeft size={14} />
                Trang chủ
              </Link>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Hoàn thành nhiệm vụ ngày và tuần. Tiến trình tự động cập nhật theo hoạt động của bạn.
            </p>
          </div>

          <MissionsClient />
        </div>
      </main>
    </>
  );
}
