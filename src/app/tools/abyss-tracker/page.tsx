import { ArrowLeft, Mountain } from "lucide-react";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { AbyssTrackerClient } from "@/components/tools/AbyssTrackerClient";

export const metadata = {
  title: "Profile Tracker — Genshin Ban/Pick",
  description: "Tra cứu thông tin công khai từ Enka.Network. Xem AR, nhân vật showcase.",
};

export const dynamic = "force-dynamic";

export default function AbyssTrackerPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="glass-strong rounded-3xl px-6 py-5 sm:px-8 sm:py-6 animate-fade-in-up">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                  <Mountain size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Tools</p>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">Profile Tracker</h1>
                </div>
              </div>
              <Link href="/" className="btn-outline shrink-0">
                <ArrowLeft size={14} />
                Trang chủ
              </Link>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Tra cứu thông tin công khai từ Enka.Network. Xem AR, nhân vật showcase.
            </p>
          </div>

          <AbyssTrackerClient />
        </div>
      </main>
    </>
  );
}
