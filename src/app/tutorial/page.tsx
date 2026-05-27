import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { TutorialClient } from "@/components/tutorial/TutorialClient";

export const metadata = {
  title: "Hướng dẫn sử dụng — Genshin Ban/Pick",
  description: "Hướng dẫn step-by-step cho người mới bắt đầu.",
};

export const dynamic = "force-static";

export default function TutorialPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Header */}
          <div className="glass-strong rounded-3xl px-6 py-5 sm:px-8 sm:py-6 animate-fade-in-up">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                  <GraduationCap size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Tutorial</p>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">Hướng dẫn sử dụng</h1>
                </div>
              </div>
              <Link href="/" className="btn-outline shrink-0">
                <ArrowLeft size={14} />
                Trang chủ
              </Link>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Lần đầu sử dụng? Đi qua các bước dưới đây để hiểu cách hoạt động của Ban/Pick La Hoàn Cảnh Giới.
            </p>
          </div>

          <TutorialClient />
        </div>
      </main>
    </>
  );
}
