import Link from "next/link";
import { ArrowLeft, TrendingUp, Crown, Shield, AlertTriangle } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { MetaDashboardClient } from "@/components/meta/MetaDashboardClient";
import { services } from "@/composition/services";
import { getCharacters } from "@/lib/genshin";

export const metadata = {
  title: "Meta Tier List — Genshin Ban/Pick",
  description: "Tier list nhân vật dựa trên dữ liệu pick/ban thực tế từ hệ thống.",
};

export default async function MetaPage() {
  const [characters, statsResult] = await Promise.all([
    getCharacters(),
    services.characterStats.getAllStats(),
  ]);

  const stats = statsResult.ok ? statsResult.data.stats : [];

  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Header */}
          <div className="glass-strong rounded-3xl px-6 py-5 sm:px-8 sm:py-6 animate-fade-in-up">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300">
                  <TrendingUp size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Analytics</p>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">Meta Tier List</h1>
                </div>
              </div>
              <Link href="/" className="btn-outline shrink-0">
                <ArrowLeft size={14} />
                Trang chủ
              </Link>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Xếp hạng nhân vật theo pick rate và ban rate thực tế từ database. Dữ liệu tự động cập nhật.
            </p>
          </div>

          <MetaDashboardClient
            characters={characters.map((c) => ({
              id: c.id,
              name: c.name,
              element: c.element,
              rarity: c.rarity,
            }))}
            stats={stats.map((s: { characterId: string; pickCount: number; banCount: number }) => ({
              characterId: s.characterId,
              pickCount: s.pickCount,
              banCount: s.banCount,
            }))}
          />
        </div>
      </main>
    </>
  );
}
