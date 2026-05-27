import Link from "next/link";
import { ArrowLeft, Activity } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { StatusClient } from "@/components/system/StatusClient";

export const metadata = {
  title: "Trạng thái hệ thống — Genshin Ban/Pick",
  description: "Trạng thái real-time của database, Supabase, và các API gateway.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function StatusPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Header */}
          <div className="glass-strong rounded-3xl px-6 py-5 sm:px-8 sm:py-6 animate-fade-in-up">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                  <Activity size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">System</p>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">Trạng thái hệ thống</h1>
                </div>
              </div>
              <Link href="/" className="btn-outline shrink-0">
                <ArrowLeft size={14} />
                Trang chủ
              </Link>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Theo dõi trạng thái real-time của các thành phần hệ thống. Tự động làm mới mỗi 30 giây.
            </p>
          </div>

          <StatusClient />
        </div>
      </main>
    </>
  );
}
