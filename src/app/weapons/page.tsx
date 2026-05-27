import Link from "next/link";
import { ArrowLeft, Sword } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { WeaponsCatalogClient } from "@/components/weapons/WeaponsCatalogClient";
import { services } from "@/composition/services";

export const metadata = {
  title: "Tủ Vũ khí — Genshin Ban/Pick",
  description: "Danh sách vũ khí Genshin Impact: filter theo loại, độ hiếm.",
};

export default async function WeaponsPage() {
  const result = await services.weaponCatalog.listWeapons();
  const weapons = result.ok ? result.data.weapons : [];

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
                  <Sword size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Catalog</p>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">Tủ Vũ khí</h1>
                </div>
              </div>
              <Link href="/" className="btn-outline shrink-0">
                <ArrowLeft size={14} />
                Trang chủ
              </Link>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Danh sách {weapons.length} vũ khí Genshin Impact. Tìm kiếm, lọc theo loại và độ hiếm.
            </p>
          </div>

          <WeaponsCatalogClient
            weapons={weapons.map((w) => ({
              id: w.id,
              name: w.name,
              type: w.type,
              rarity: w.rarity,
              iconUrl: w.iconUrl,
            }))}
          />
        </div>
      </main>
    </>
  );
}
