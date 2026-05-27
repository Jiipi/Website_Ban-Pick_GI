import { ArrowLeft, Shuffle } from "lucide-react";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { CharacterRandomizerClient } from "@/components/tools/CharacterRandomizerClient";
import { getCharacters } from "@/lib/genshin";

export const metadata = {
  title: "Random Nhân vật — Genshin Ban/Pick",
  description: "Chọn ngẫu nhiên nhân vật theo điều kiện lọc. Phù hợp cho event, stream challenge.",
};

export const dynamic = "force-dynamic";

export default async function CharacterRandomizerPage() {
  const characters = await getCharacters();

  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="glass-strong rounded-3xl px-6 py-5 sm:px-8 sm:py-6 animate-fade-in-up">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300">
                  <Shuffle size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Tools</p>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">Random Nhân vật</h1>
                </div>
              </div>
              <Link href="/" className="btn-outline shrink-0">
                <ArrowLeft size={14} />
                Trang chủ
              </Link>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Chọn ngẫu nhiên nhân vật theo điều kiện lọc. Phù hợp cho event, stream challenge.
            </p>
          </div>

          <CharacterRandomizerClient characters={characters} />
        </div>
      </main>
    </>
  );
}
