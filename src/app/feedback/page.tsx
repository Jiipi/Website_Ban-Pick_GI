import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { FeedbackFormClient } from "@/components/feedback/FeedbackFormClient";

export const metadata = {
  title: "Góp ý — Genshin Ban/Pick",
  description: "Gửi góp ý, báo lỗi hoặc đề xuất tính năng cho hệ thống Ban/Pick.",
};

export default function FeedbackPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-10">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Header */}
          <div className="glass-strong rounded-3xl p-8 sm:p-10 animate-fade-in-up">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                  <MessageSquare size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Feedback</p>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">Góp ý & Báo lỗi</h1>
                </div>
              </div>
              <Link href="/" className="btn-outline shrink-0">
                <ArrowLeft size={14} />
                Trang chủ
              </Link>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Gửi feature request, bug report hoặc góp ý cân bằng. Ý kiến của bạn giúp web hoàn thiện hơn.
            </p>
          </div>

          <FeedbackFormClient />

          <section className="glass-strong rounded-3xl p-6 animate-fade-in-up delay-200">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">Nên gửi gì?</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {SUGGESTIONS.map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-700/40 bg-slate-900/40 p-4">
                  <p className="text-sm font-bold text-slate-100">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

const SUGGESTIONS = [
  {
    title: "Bug report",
    description: "Mô tả bước tái hiện, trang gặp lỗi và ảnh chụp nếu có.",
  },
  {
    title: "Feature request",
    description: "Nêu rõ use case, ai cần dùng và vì sao tính năng này hữu ích.",
  },
  {
    title: "Cân bằng luật",
    description: "Góp ý về cost, handicap, format giải hoặc draft order.",
  },
  {
    title: "Nội dung / UI",
    description: "Đề xuất cải thiện guide, docs, wording, màu sắc hoặc trải nghiệm mobile.",
  },
];
