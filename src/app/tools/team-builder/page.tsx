import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { TeamBuilderClient } from "@/components/tools/TeamBuilderClient";
import { getCharacters } from "@/lib/genshin";

export const metadata = {
  title: "Team Builder — Genshin Ban/Pick",
  description: "Xây dựng team comp 8 nhân vật, xem preview cost và cảnh báo thiếu nguyên tố.",
};

export const dynamic = "force-dynamic";

export default async function TeamBuilderPage() {
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
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                  <Users size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Tools</p>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">Team Builder</h1>
                </div>
              </div>
              <Link href="/" className="btn-outline shrink-0">
                <ArrowLeft size={14} />
                Trang chủ
              </Link>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Xây dựng team comp 8 nhân vật, xem preview cost và cảnh báo thiếu nguyên tố.
            </p>
          </div>

          <TeamBuilderClient characters={data} />
        </div>
      </main>
    </>
  );
}
