import Link from "next/link";
import { ArrowLeft, FileText, Sparkles, Wrench, Bug, Zap, Gamepad2 } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { PatchNotesClient } from "@/components/system/PatchNotesClient";

export const metadata = {
  title: "Patch Notes — Genshin Ban/Pick",
  description: "Ghi chú cập nhật trang web và thông tin patch game.",
};

export const dynamic = "force-static";

export default function PatchNotesPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="glass-strong rounded-3xl p-8 sm:p-10 animate-fade-in-up">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                  <FileText size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Patch Notes</p>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">Ghi chú cập nhật</h1>
                </div>
              </div>
              <Link href="/" className="btn-outline shrink-0">
                <ArrowLeft size={14} />
                Trang chủ
              </Link>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Cập nhật trang web và thông tin các phiên bản game Genshin Impact liên quan đến meta ban/pick.
            </p>
          </div>

          <PatchNotesClient />
        </div>
      </main>
    </>
  );
}
