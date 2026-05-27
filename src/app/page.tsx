import Link from "next/link";
import { Swords } from "lucide-react";
import { services } from "@/composition/services";
import { HomeClient } from "@/components/HomeClient";

export default async function HomePage() {
  const user = await services.auth.getCurrentUserRecord();

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="glass-strong mx-auto w-full max-w-3xl rounded-3xl p-8 sm:p-10">
        {/* ── Hero ── */}
        <div className="home-hero">
          <div className="home-hero__icon">
            <Swords size={22} />
          </div>
          <p className="home-hero__eyebrow">Genshin Impact</p>
          <h1 className="home-hero__title">Ban/Pick La Hoàn Cảnh Giới</h1>
          <p className="home-hero__subtitle">
            Công cụ cấm/chọn nhân vật chuyên dụng cho giải đấu La Hoàn Cảnh Giới.
          </p>
        </div>

        <div className="divider mb-8" />

        {/* ── Client interactive content ── */}
        <HomeClient
          authenticated={Boolean(user)}
          userEmail={user?.email ?? null}
          userName={user?.name ?? null}
          userRole={user?.role ?? null}
        />

        {/* ── Footer ── */}
        <div className="mt-8 flex flex-col items-center gap-2 text-center">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/tournaments" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Giải đấu</Link>
            <span className="text-slate-700">·</span>
            <Link href="/characters" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Tủ nhân vật</Link>
            <span className="text-slate-700">·</span>
            <Link href="/meta" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Meta</Link>
            <span className="text-slate-700">·</span>
            <Link href="/weapons" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Vũ khí</Link>
            <span className="text-slate-700">·</span>
            <Link href="/leaderboard" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Xếp hạng</Link>
            <span className="text-slate-700">·</span>
            <Link href="/missions" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Nhiệm vụ</Link>
            <span className="text-slate-700">·</span>
            <Link href="/achievements" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Thành tựu</Link>
            <span className="text-slate-700">·</span>
            <Link href="/feed" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Bảng tin</Link>
            <span className="text-slate-700">·</span>
            <Link href="/friends" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Bạn bè</Link>
            <span className="text-slate-700">·</span>
            <Link href="/shop" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Shop</Link>
            <span className="text-slate-700">·</span>
            <Link href="/settings" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Cài đặt</Link>
            <span className="text-slate-700">·</span>
            <Link href="/history" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Lịch sử</Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/tools/cost-calculator" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Calculator</Link>
            <span className="text-slate-700">·</span>
            <Link href="/tools/team-builder" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Team Builder</Link>
            <span className="text-slate-700">·</span>
            <Link href="/tools/draft-simulator" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Draft Simulator</Link>
            <span className="text-slate-700">·</span>
            <Link href="/tools/character-randomizer" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Randomizer</Link>
            <span className="text-slate-700">·</span>
            <Link href="/tools/abyss-tracker" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Profile Tracker</Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/rules" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Luật chơi</Link>
            <span className="text-slate-700">·</span>
            <Link href="/guide" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Guide</Link>
            <span className="text-slate-700">·</span>
            <Link href="/tutorial" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Hướng dẫn</Link>
            <span className="text-slate-700">·</span>
            <Link href="/about" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Giới thiệu</Link>
            <span className="text-slate-700">·</span>
            <Link href="/changelog" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Changelog</Link>
            <span className="text-slate-700">·</span>
            <Link href="/patch-notes" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Patch Notes</Link>
            <span className="text-slate-700">·</span>
            <Link href="/api-docs" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">API Docs</Link>
            <span className="text-slate-700">·</span>
            <Link href="/status" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Status</Link>
            <span className="text-slate-700">·</span>
            <Link href="/feedback" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Góp ý</Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/privacy" className="text-[10px] text-slate-700 hover:text-slate-500 transition-colors">Bảo mật</Link>
            <span className="text-slate-800">·</span>
            <Link href="/terms" className="text-[10px] text-slate-700 hover:text-slate-500 transition-colors">Điều khoản</Link>
          </div>
          <p className="text-xs text-slate-600">
            v3.5 · Genshin Impact Ban/Pick Tool
          </p>
        </div>
      </section>
    </main>
  );
}

// Hint to Next.js this page can't be statically rendered (uses cookies)
export const dynamic = "force-dynamic";
export const revalidate = 0;
