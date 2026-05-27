import Link from "next/link";
import { ArrowLeft, Swords } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { DraftSimulatorClient } from "@/components/tools/DraftSimulatorClient";
import { getCharacters } from "@/lib/genshin";

export const metadata = {
  title: "Draft Simulator — Genshin Ban/Pick",
  description: "Luyện tập draft vs bot. Bạn chơi 1 đội, bot tự động chọn cho đội còn lại.",
};

export const dynamic = "force-dynamic";

export default async function DraftSimulatorPage() {
  const characters = await getCharacters();
  const data = characters.map((c) => ({
    id: c.id,
    name: c.name,
    element: c.element,
    rarity: c.rarity,
  }));

  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Header */}
          <div className="glass-strong rounded-3xl px-6 py-5 sm:px-8 sm:py-6 animate-fade-in-up">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                  <Swords size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Tools</p>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">Draft Simulator</h1>
                </div>
              </div>
              <Link href="/" className="btn-outline shrink-0">
                <ArrowLeft size={14} />
                Trang chủ
              </Link>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Luyện tập draft vs bot. Bạn chơi 1 đội, bot tự động chọn cho đội còn lại.
            </p>
          </div>

          <DraftSimulatorClient characters={data} />
        </div>
      </main>
    </>
  );
}
