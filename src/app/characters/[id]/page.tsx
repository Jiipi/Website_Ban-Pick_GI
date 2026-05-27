import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Activity, Ban, Target, Users2, Zap } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { services } from "@/composition/services";
import { ELEMENT_COLORS, ELEMENT_ICONS, type CharacterElement } from "@/lib/genshin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const result = await services.characterCatalog.listCharacters({ refresh: false });
  if (!result.ok) return { title: "Nhân vật — Genshin Ban/Pick" };
  const character = result.data.characters.find((c) => c.id === id);
  return {
    title: `${character?.name ?? "Nhân vật"} — Genshin Ban/Pick`,
    description: `Thống kê pick/ban của ${character?.name ?? id} trong các trận đấu La Hoàn Cảnh Giới.`,
  };
}

export default async function CharacterDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [catalogResult, statsResult] = await Promise.all([
    services.characterCatalog.listCharacters({ refresh: false }),
    services.characterStats.getCharacterStats(id),
  ]);

  if (!catalogResult.ok) notFound();
  const character = catalogResult.data.characters.find((c) => c.id === id);
  if (!character) notFound();

  const stats = statsResult.ok ? statsResult.data : null;
  const characterMap = new Map(catalogResult.data.characters.map((c) => [c.id, c]));

  const element = character.element as CharacterElement;
  const elementColor = ELEMENT_COLORS[element] ?? "#C0C0C0";
  const rarityClass = character.rarity === 5 ? "from-amber-500/20 to-orange-500/10" : "from-violet-500/20 to-purple-500/10";

  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-5">
          {/* Top nav */}
          <div className="flex items-center justify-between">
            <Link href="/characters" className="btn-outline">
              <ArrowLeft size={14} />
              Tủ nhân vật
            </Link>
            <span className="text-xs text-slate-500">
              {stats ? `${stats.totalMatches} trận đã phân tích` : ""}
            </span>
          </div>

          {/* Hero */}
          <div className={`glass-strong rounded-3xl overflow-hidden animate-fade-in-up`}>
            <div
              className={`relative bg-gradient-to-br ${rarityClass} px-6 py-6 sm:px-8 sm:py-8`}
              style={{ borderBottom: `1px solid ${elementColor}30` }}
            >
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end">
                {/* Portrait */}
                <div
                  className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl border-2 sm:h-40 sm:w-40"
                  style={{ borderColor: elementColor, boxShadow: `0 0 40px ${elementColor}30` }}
                >
                  {character.chibiIconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={character.chibiIconUrl} alt={character.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-5xl">
                      {ELEMENT_ICONS[element]}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <span
                      className="rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
                      style={{ background: `${elementColor}30`, color: elementColor }}
                    >
                      {ELEMENT_ICONS[element]} {element}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-black tracking-wider ${
                        character.rarity === 5 ? "bg-amber-500/15 text-amber-300" : "bg-violet-500/15 text-violet-300"
                      }`}
                    >
                      {"★".repeat(character.rarity)}
                    </span>
                  </div>
                  <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-100 sm:text-4xl">
                    {character.name}
                  </h1>
                  <p className="mt-1 font-mono text-xs text-slate-500">{character.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-up delay-100">
            <StatCard
              icon={<Target size={16} />}
              label="Lượt pick"
              value={stats?.pickCount ?? 0}
              color="cyan"
              hint={stats?.totalMatches ? `${stats.pickRate}% pick rate` : undefined}
            />
            <StatCard
              icon={<Ban size={16} />}
              label="Lượt ban"
              value={stats?.banCount ?? 0}
              color="rose"
              hint={stats?.totalMatches ? `${stats.banRate}% ban rate` : undefined}
            />
            <StatCard
              icon={<Activity size={16} />}
              label="Tổng xuất hiện"
              value={(stats?.pickCount ?? 0) + (stats?.banCount ?? 0)}
              color="amber"
              hint={stats?.totalMatches ? `Trên ${stats.totalMatches} trận` : "Chưa có dữ liệu"}
            />
            <StatCard
              icon={<Zap size={16} />}
              label="Độ ưu tiên"
              value={priorityLabel(stats?.pickRate ?? 0, stats?.banRate ?? 0)}
              color="violet"
              hint="Xếp loại tổng hợp"
              isText
            />
          </div>

          {/* Paired-with */}
          {stats && stats.pairedWith.length > 0 && (
            <section className="glass-strong rounded-3xl p-6 animate-fade-in-up delay-200">
              <div className="flex items-center gap-2 mb-4">
                <Users2 size={16} className="text-emerald-300" />
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">
                  Hay đi cùng nhất
                </h2>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {stats.pairedWith.map((p) => {
                  const partner = characterMap.get(p.characterId);
                  return (
                    <Link
                      key={p.characterId}
                      href={`/characters/${p.characterId}`}
                      className="group glass rounded-xl overflow-hidden transition-all hover:scale-105"
                    >
                      <div className="aspect-square bg-slate-800/40 flex items-center justify-center overflow-hidden">
                        {partner?.chibiIconUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={partner.chibiIconUrl} alt={partner.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-2xl text-slate-600">?</span>
                        )}
                      </div>
                      <div className="px-2 py-1.5">
                        <p className="truncate text-[11px] font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">
                          {partner?.name ?? p.characterId}
                        </p>
                        <p className="text-[9px] text-slate-500">{p.count} lần đi cùng</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Recent matches */}
          {stats && stats.recentMatches.length > 0 && (
            <section className="glass-strong rounded-3xl p-6 animate-fade-in-up delay-300">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={16} className="text-violet-300" />
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">
                  Trận đấu gần đây
                </h2>
              </div>
              <div className="space-y-2">
                {stats.recentMatches.map((m, idx) => (
                  <Link
                    key={`${m.roomCode}-${idx}`}
                    href={`/room/${m.roomCode}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-slate-700/40 bg-slate-900/40 px-4 py-2.5 hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shrink-0 ${
                          m.action === "PICK" ? "bg-cyan-500/15 text-cyan-300" : "bg-rose-500/15 text-rose-300"
                        }`}
                      >
                        {m.action === "PICK" ? "🎯 Pick" : "⛔ Ban"}
                      </span>
                      <span
                        className={`text-xs font-bold ${m.player === "BLUE" ? "text-cyan-300" : "text-rose-300"}`}
                      >
                        {m.player === "BLUE" ? "Đội Xanh" : "Đội Đỏ"}
                      </span>
                      <span className="font-mono text-xs text-slate-500 truncate">
                        {m.bluePlayerName ?? "—"} vs {m.redPlayerName ?? "—"}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-slate-500 shrink-0">
                      {m.roomCode}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Empty state if no stats */}
          {(!stats || (stats.pickCount === 0 && stats.banCount === 0)) && (
            <div className="glass-strong rounded-3xl py-12 text-center animate-fade-in-up delay-200">
              <p className="text-3xl">📊</p>
              <p className="mt-3 font-bold text-slate-300">Chưa có dữ liệu thống kê</p>
              <p className="mt-1 text-sm text-slate-500">
                Nhân vật này chưa xuất hiện trong trận đấu nào.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  color,
  isText,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint?: string;
  color: "cyan" | "rose" | "amber" | "violet";
  isText?: boolean;
}) {
  const colorMap = {
    cyan: "text-cyan-300 bg-cyan-500/10",
    rose: "text-rose-300 bg-rose-500/10",
    amber: "text-amber-300 bg-amber-500/10",
    violet: "text-violet-300 bg-violet-500/10",
  };
  return (
    <div className="glass rounded-2xl p-4">
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 font-mono font-black tabular-nums ${isText ? "text-xl" : "text-3xl"} text-slate-100`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-[10px] text-slate-500">{hint}</p>}
    </div>
  );
}

function priorityLabel(pickRate: number, banRate: number): string {
  const score = pickRate + banRate * 1.2;
  if (score >= 80) return "Meta";
  if (score >= 50) return "Cao";
  if (score >= 20) return "TB";
  if (score > 0) return "Thấp";
  return "—";
}
