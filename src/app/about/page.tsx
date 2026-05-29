import Link from "next/link";
import { ArrowLeft, Code2, Database, Globe, Layers, Sparkles, Users } from "lucide-react";
import { NavBar } from "@/components/NavBar";

export const metadata = {
  title: "Giới thiệu — Genshin Ban/Pick",
  description: "Giới thiệu về dự án website Ban/Pick Genshin Impact La Hoàn Cảnh Giới.",
};

export default function AboutPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="glass-strong rounded-3xl p-8 sm:p-10 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                <Sparkles size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Genshin Impact</p>
                <h1 className="text-2xl font-black tracking-tight text-slate-100">Về dự án</h1>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-slate-300">
              <strong className="text-cyan-300">Genshin Ban/Pick</strong> là công cụ chuyên dụng cho cộng đồng tổ
              chức giải đấu La Hoàn Cảnh Giới. Hệ thống tự động hoá toàn bộ quy trình cấm/chọn
              nhân vật, tính điểm trang bị (Cost) và bù trừ thời gian (Handicap) thay cho phương pháp
              thủ công bằng Excel hoặc tin nhắn.
            </p>
          </div>

          <section className="glass-strong rounded-3xl p-8 animate-fade-in-up delay-100">
            <h2 className="text-lg font-black tracking-tight text-slate-100 mb-4">Mục tiêu</h2>
            <ul className="space-y-3 text-sm leading-relaxed text-slate-300">
              <li className="flex gap-3">
                <span className="text-cyan-400">▸</span>
                Cung cấp một sân chơi <strong className="text-slate-100">trực quan, real-time</strong> cho các
                giải đấu cộng đồng Genshin Impact.
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400">▸</span>
                Chuẩn hoá quy trình Ban/Pick chuyên nghiệp theo chuẩn eSports với 4 phase, 22 lượt.
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400">▸</span>
                Tự động hoá tính toán Cost &amp; Handicap chính xác đến từng giây.
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400">▸</span>
                Hỗ trợ đầy đủ ba vai trò: Trọng tài, Tuyển thủ và Khán giả.
              </li>
            </ul>
          </section>

          <section className="glass-strong rounded-3xl p-8 animate-fade-in-up delay-200">
            <div className="flex items-center gap-2 mb-4">
              <Code2 size={18} className="text-amber-300" />
              <h2 className="text-lg font-black tracking-tight text-slate-100">Công nghệ sử dụng</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TechRow icon={<Layers size={14} />} label="Frontend" value="Next.js 15 (App Router) · TypeScript · Tailwind CSS" />
              <TechRow icon={<Layers size={14} />} label="State" value="Zustand" />
              <TechRow icon={<Database size={14} />} label="Database" value="Supabase Database" />
              <TechRow icon={<Globe size={14} />} label="Real-time" value="Supabase Realtime (WebSockets)" />
              <TechRow icon={<Users size={14} />} label="Auth" value="Supabase Auth (SSR)" />
              <TechRow icon={<Sparkles size={14} />} label="Data" value="Enka.Network · Genshin.dev" />
            </div>
          </section>

          <section className="glass-strong rounded-3xl p-8 animate-fade-in-up delay-300">
            <h2 className="text-lg font-black tracking-tight text-slate-100 mb-4">Kiến trúc</h2>
            <p className="text-sm leading-relaxed text-slate-300 mb-4">
              Dự án sử dụng <strong className="text-cyan-300">layered architecture</strong> trong Next.js runtime
              để tách biệt rạch ròi giữa logic nghiệp vụ và phụ thuộc bên ngoài (Supabase, HTTP):
            </p>
            <div className="space-y-2 text-sm">
              <ArchRow color="cyan" label="Presentation" desc="src/app, src/components — Render UI, parse request" />
              <ArchRow color="violet" label="Application" desc="src/application — Service classes, use cases" />
              <ArchRow color="amber" label="Domain" desc="src/domain — Pure business rules (DraftPolicy, CostPolicy)" />
              <ArchRow color="emerald" label="Infrastructure" desc="src/infrastructure — Supabase + HTTP gateway adapters" />
              <ArchRow color="rose" label="Composition" desc="src/composition — Wires adapters into services" />
            </div>
          </section>

          <section className="glass-strong rounded-3xl p-8 animate-fade-in-up delay-400">
            <h2 className="text-lg font-black tracking-tight text-slate-100 mb-4">Roadmap</h2>
            <ol className="space-y-3 text-sm leading-relaxed text-slate-300">
              <li className="flex gap-3">
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-300 shrink-0">DONE</span>
                Core Ban/Pick 22 lượt + Cost + Handicap + Real-time
              </li>
              <li className="flex gap-3">
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-300 shrink-0">DONE</span>
                Lobby + Auth + Live Chat + Export image
              </li>
              <li className="flex gap-3">
                <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-black text-cyan-300 shrink-0">NOW</span>
                Character database, Leaderboard, Cost Calculator standalone
              </li>
              <li className="flex gap-3">
                <span className="rounded bg-slate-500/10 px-2 py-0.5 text-[10px] font-black text-slate-400 shrink-0">NEXT</span>
                Tournament suite (bracket, Bo3/Bo5, Fearless), OBS overlay
              </li>
              <li className="flex gap-3">
                <span className="rounded bg-slate-500/10 px-2 py-0.5 text-[10px] font-black text-slate-400 shrink-0">LATER</span>
                Achievement, Friends, Discord webhook, i18n
              </li>
            </ol>
          </section>

          <div className="text-center pt-4">
            <Link href="/" className="btn-outline">
              <ArrowLeft size={14} />
              Về trang chủ
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

function TechRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-700/40 bg-slate-900/40 px-4 py-3">
      <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded bg-slate-800/60 text-slate-400">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-200 truncate">{value}</p>
      </div>
    </div>
  );
}

function ArchRow({ color, label, desc }: { color: "cyan" | "violet" | "amber" | "emerald" | "rose"; label: string; desc: string }) {
  const colorMap: Record<string, string> = {
    cyan: "bg-cyan-500/10 text-cyan-300",
    violet: "bg-violet-500/10 text-violet-300",
    amber: "bg-amber-500/10 text-amber-300",
    emerald: "bg-emerald-500/10 text-emerald-300",
    rose: "bg-rose-500/10 text-rose-300",
  };
  return (
    <div className="flex items-baseline gap-3">
      <span className={`rounded px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${colorMap[color]} shrink-0 min-w-[110px] text-center`}>
        {label}
      </span>
      <span className="text-xs leading-relaxed text-slate-400">{desc}</span>
    </div>
  );
}
