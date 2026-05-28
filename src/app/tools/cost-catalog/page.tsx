import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { CostCatalogManager } from "@/components/cost/CostCatalogManager";
import { services } from "@/composition/services";
import { defaultCostCatalog } from "@/domain/cost/CostCatalog";
import { SESSION_KEYS } from "@/lib/constants";

export const metadata = {
  title: "Cost Catalog — Genshin Ban/Pick",
  description: "Quản lý bảng cost global dùng cho toàn bộ web.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CostCatalogPage() {
  const [charactersResult, weaponsResult, catalogResult] = await Promise.all([
    services.characterCatalog.listCharacters({ refresh: false }),
    services.weaponCatalog.listWeapons(),
    services.costCatalog.getCatalog(),
  ]);
  const cookieStore = await cookies();
  const clientId = cookieStore.get(SESSION_KEYS.clientId)?.value ?? "";
  const characters = charactersResult.ok
    ? charactersResult.data.characters.map((character) => ({
        id: character.id,
        name: character.name,
        element: character.element,
        rarity: character.rarity,
        chibiIconUrl: character.chibiIconUrl ?? "",
      }))
    : [];
  const weapons = weaponsResult.ok ? weaponsResult.data.weapons : [];
  const catalog = catalogResult.ok ? catalogResult.data.catalog : defaultCostCatalog;

  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="glass-strong rounded-3xl px-6 py-5 sm:px-8 sm:py-6 animate-fade-in-up">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                  <SlidersHorizontal size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Tools</p>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">Cost Catalog</h1>
                </div>
              </div>
              <Link href="/" className="btn-outline shrink-0">
                <ArrowLeft size={14} />
                Trang chủ
              </Link>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              File cost này áp dụng global cho phòng đấu, lịch sử, archive, thống kê và Cost Calculator. Admin có thể sửa bất kỳ lúc nào; host chỉ sửa được trước khi draft bắt đầu.
            </p>
          </div>

          <div className="glass-strong rounded-3xl p-5 sm:p-6 animate-fade-in-up delay-100">
            <CostCatalogManager
              clientId={clientId}
              characters={characters}
              weapons={weapons}
              catalog={catalog}
              disabled={!clientId}
            />
            {!clientId && (
              <p className="mt-3 text-right text-xs font-bold text-amber-200">
                Hãy vào sảnh/phòng một lần để tạo session trước khi nhập hoặc lưu cost.
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
