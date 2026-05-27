import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { services } from "@/composition/services";
import { CharactersGalleryClient } from "@/components/characters/CharactersGalleryClient";

export const metadata = {
  title: "Tủ nhân vật — Genshin Ban/Pick",
  description: "Danh sách nhân vật Genshin Impact với thống kê pick/ban từ các giải đấu.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CharactersPage() {
  const [catalogResult, statsResult] = await Promise.all([
    services.characterCatalog.listCharacters({ refresh: false }),
    services.characterStats.getAllStats(),
  ]);

  const characters = catalogResult.ok ? catalogResult.data.characters : [];
  const stats = statsResult.ok ? statsResult.data.stats : [];
  const totalMatches = statsResult.ok ? statsResult.data.totalMatches : 0;

  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Header */}
          <div className="glass-strong rounded-3xl px-6 py-5 sm:px-8 sm:py-6 animate-fade-in-up">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                  <Users size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Database</p>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">Tủ nhân vật</h1>
                </div>
              </div>
              <Link href="/" className="btn-outline shrink-0">
                <ArrowLeft size={14} />
                Trang chủ
              </Link>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              <strong className="text-slate-200">{characters.length}</strong> nhân vật · Thống kê tổng hợp từ{" "}
              <strong className="text-slate-200">{totalMatches}</strong> trận đã hoàn tất.
            </p>
          </div>

          <CharactersGalleryClient characters={characters} stats={stats} totalMatches={totalMatches} />
        </div>
      </main>
    </>
  );
}
