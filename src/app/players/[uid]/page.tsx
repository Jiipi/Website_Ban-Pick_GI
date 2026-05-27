import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trophy, Target, Ban as BanIcon, Activity, Zap, TrendingUp } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { services } from "@/composition/services";
import { ELEMENT_COLORS, ELEMENT_ICONS, type CharacterElement } from "@/lib/genshin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ uid: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { uid } = await params;
  return {
    title: `Player ${uid} — Genshin Ban/Pick`,
    description: `Profile public của player UID ${uid}.`,
  };
}

export default async function PlayerProfilePage({ params }: PageProps) {
  const { uid } = await params;
  const result = await services.leaderboard.getPlayerProfile(uid);

  if (!result.ok) notFound();

  const { profile, stats, matches } = result.data;
  const totalMatches = stats.totalMatches;
  const winRate = totalMatches > 0 ? Math.round((stats.wins / totalMatches) * 100) : 0;
  const displayName = profile.displayName ?? profile.nickname;
  const avatarUrl = profile.customAvatarUrl ?? profile.avatarUrl;

  // Aggregate top picks/bans
  const pickCounts = new Map<string, number>();
  const banCounts = new Map<string, number>();
  for (const m of matches) {
    for (const p of m.picks) pickCounts.set(p, (pickCounts.get(p) ?? 0) + 1);
    for (const b of m.bans) banCounts.set(b, (banCounts.get(b) ?? 0) + 1);
  }
  const topPicks = Array.from(pickCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topBans = Array.from(banCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);

  // Enhanced stats
  const avgCost = totalMatches > 0
    ? Math.round(matches.reduce((s, m) => s + m.selfCost, 0) / totalMatches)
    : 0;

  // Win streak (current)
  let currentStreak = 0;
  for (const m of matches) {
    if (m.result === "WIN") currentStreak++;
    else break;
  }



  // Need character map for icons in top picks/bans + element distribution
  const catalogResult = await services.characterCatalog.listCharacters({ refresh: false });
  const characterMap = catalogResult.ok
    ? new Map(catalogResult.data.characters.map((c) => [c.id, c]))
    : new Map();

  // Element distribution from picks
  const elementCounts = new Map<string, number>();
  for (const m of matches) {
    for (const p of m.picks) {
      const ch = characterMap.get(p);
      if (ch) {
        elementCounts.set(ch.element, (elementCounts.get(ch.element) ?? 0) + 1);
      }
    }
  }
  const totalElements = Array.from(elementCounts.values()).reduce((s, v) => s + v, 0);
  const elementEntries = Array.from(elementCounts.entries())
    .sort((a, b) => b[1] - a[1]);

  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-5">
          {/* Top nav */}
          <div className="flex items-center justify-between">
            <Link href="/leaderboard" className="btn-outline">
              <ArrowLeft size={14} />
              Bảng xếp hạng
            </Link>
          </div>

          {/* Hero */}
          <div className="glass-strong rounded-3xl p-6 sm:p-8 animate-fade-in-up">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-28 w-28 shrink-0 rounded-2xl border-2 border-cyan-500/40 object-cover shadow-lg shadow-cyan-500/20"
                />
              ) : (
                <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-700/60 bg-slate-800 text-4xl font-black text-slate-500">
                  {displayName.charAt(0)}
                </div>
              )}
              <div className="flex-1 text-center sm:text-left">
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Player Profile</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-100 sm:text-4xl">
                  {displayName}
                </h1>
                <p className="mt-1 font-mono text-xs text-slate-500">UID: {profile.uid}</p>
                {totalMatches > 0 && (
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                    <RankBadge winRate={winRate} totalMatches={totalMatches} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 animate-fade-in-up delay-100">
            <StatCard icon={<Activity size={16} />} label="Tổng trận" value={stats.totalMatches} color="violet" />
            <StatCard icon={<Trophy size={16} />} label="Thắng" value={stats.wins} color="emerald" />
            <StatCard icon={<BanIcon size={16} />} label="Thua" value={stats.losses} color="rose" />
            <StatCard icon={<Target size={16} />} label="Hoà" value={stats.draws} color="amber" />
            <StatCard icon={<Zap size={16} />} label="Avg Cost" value={avgCost} color="violet" />
            <StatCard icon={<TrendingUp size={16} />} label="Chuỗi thắng" value={currentStreak} color="emerald" />
          </div>

          {/* Element Distribution */}
          {totalElements > 0 && (
            <div className="glass-strong rounded-2xl p-5 animate-fade-in-up delay-150">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 mb-3">Phân bố nguyên tố</h3>
              <div className="flex items-center gap-4">
                {/* CSS-only pie chart via conic-gradient */}
                <div
                  className="h-24 w-24 shrink-0 rounded-full shadow-lg"
                  style={{
                    background: `conic-gradient(${elementEntries
                      .reduce<{ segments: string[]; offset: number }>(
                        (acc, [el, count]) => {
                          const pct = (count / totalElements) * 100;
                          const color = ELEMENT_COLORS[el as CharacterElement] ?? "#64748b";
                          acc.segments.push(`${color} ${acc.offset}% ${acc.offset + pct}%`);
                          acc.offset += pct;
                          return acc;
                        },
                        { segments: [], offset: 0 },
                      )
                      .segments.join(", ")})`,
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  {elementEntries.map(([el, count]) => (
                    <div key={el} className="flex items-center gap-1.5 rounded-lg bg-slate-800/40 px-2 py-1">
                      <span className="text-xs">
                        {ELEMENT_ICONS[el as CharacterElement] ?? "?"}
                      </span>
                      <span className="text-[10px] font-bold text-slate-200">{el}</span>
                      <span className="text-[10px] font-mono tabular-nums text-slate-400">
                        {Math.round((count / totalElements) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Top picks/bans */}
          {totalMatches > 0 && (topPicks.length > 0 || topBans.length > 0) && (
            <div className="grid gap-4 lg:grid-cols-2 animate-fade-in-up delay-200">
              {topPicks.length > 0 && (
                <CharBlock title="Hay chọn nhất" entries={topPicks} characterMap={characterMap} accent="cyan" />
              )}
              {topBans.length > 0 && (
                <CharBlock title="Hay cấm nhất" entries={topBans} characterMap={characterMap} accent="rose" />
              )}
            </div>
          )}

          {/* Match history */}
          <section className="glass-strong rounded-3xl p-6 animate-fade-in-up delay-300">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-200 mb-4">
              Lịch sử trận đấu ({matches.length})
            </h2>
            {matches.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-3xl">📭</p>
                <p className="mt-2 text-sm text-slate-400">Player này chưa hoàn tất trận nào.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {matches.map((m, idx) => (
                  <Link
                    key={`${m.roomCode}-${idx}`}
                    href={`/room/${m.roomCode}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-slate-700/40 bg-slate-900/40 px-4 py-3 hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ResultBadge result={m.result} />
                      <span
                        className={`text-xs font-bold ${m.side === "BLUE" ? "text-cyan-300" : "text-rose-300"}`}
                      >
                        {m.side === "BLUE" ? "Đội Xanh" : "Đội Đỏ"}
                      </span>
                      <span className="text-xs text-slate-400 truncate">
                        vs <strong className="text-slate-200">{m.opponentName ?? "—"}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-xs text-slate-400 tabular-nums">
                        {m.selfCost} : {m.opponentCost}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-slate-500">
                        {m.roomCode}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "violet" | "emerald" | "rose" | "amber";
}) {
  const colorMap = {
    violet: "text-violet-300 bg-violet-500/10",
    emerald: "text-emerald-300 bg-emerald-500/10",
    rose: "text-rose-300 bg-rose-500/10",
    amber: "text-amber-300 bg-amber-500/10",
  };
  return (
    <div className="glass rounded-2xl p-4">
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 font-mono text-3xl font-black tabular-nums text-slate-100">{value}</p>
    </div>
  );
}

function CharBlock({
  title,
  entries,
  characterMap,
  accent,
}: {
  title: string;
  entries: Array<[string, number]>;
  characterMap: Map<string, { id: string; name: string; element: string; rarity: number; chibiIconUrl: string | null }>;
  accent: "cyan" | "rose";
}) {
  const accentText = accent === "cyan" ? "text-cyan-300" : "text-rose-300";
  return (
    <div className="glass-strong rounded-2xl p-5">
      <h3 className={`text-xs font-black uppercase tracking-wider ${accentText} mb-3`}>{title}</h3>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6">
        {entries.map(([id, count]) => {
          const ch = characterMap.get(id);
          const elColor = ELEMENT_COLORS[ch?.element as CharacterElement] ?? "#C0C0C0";
          return (
            <Link
              key={id}
              href={`/characters/${id}`}
              className="group glass rounded-lg overflow-hidden transition-all hover:scale-105"
              style={{ borderColor: `${elColor}30` }}
            >
              <div className="aspect-square bg-slate-800/40 flex items-center justify-center overflow-hidden">
                {ch?.chibiIconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ch.chibiIconUrl} alt={ch.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl text-slate-600">
                    {ELEMENT_ICONS[ch?.element as CharacterElement] ?? "?"}
                  </span>
                )}
              </div>
              <div className="px-1.5 py-1">
                <p className="truncate text-[10px] font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                  {ch?.name ?? id}
                </p>
                <p className="text-[9px] tabular-nums text-slate-500">×{count}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function RankBadge({ winRate, totalMatches }: { winRate: number; totalMatches: number }) {
  const tier =
    winRate >= 80 && totalMatches >= 5
      ? { label: "Master", color: "from-amber-400 to-yellow-300", text: "text-slate-900" }
      : winRate >= 60 && totalMatches >= 3
      ? { label: "Diamond", color: "from-cyan-400 to-violet-400", text: "text-slate-900" }
      : winRate >= 40
      ? { label: "Gold", color: "from-amber-500 to-orange-400", text: "text-slate-900" }
      : { label: "Bronze", color: "from-slate-500 to-slate-400", text: "text-slate-900" };

  return (
    <>
      <span
        className={`rounded-full bg-gradient-to-r ${tier.color} px-3 py-1 text-[10px] font-black uppercase tracking-wider ${tier.text}`}
      >
        {tier.label}
      </span>
      <span className="font-mono text-xs font-bold text-slate-300 tabular-nums">
        Win rate: <span className="text-amber-300">{winRate}%</span>
      </span>
      <span className="text-[10px] text-slate-500">·</span>
      <span className="text-xs text-slate-400 tabular-nums">{totalMatches} trận</span>
    </>
  );
}

function ResultBadge({ result }: { result: "WIN" | "LOSS" | "DRAW" }) {
  if (result === "WIN") {
    return <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-300 shrink-0">W</span>;
  }
  if (result === "LOSS") {
    return <span className="rounded bg-rose-500/15 px-2 py-0.5 text-[10px] font-black text-rose-300 shrink-0">L</span>;
  }
  return <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-black text-amber-300 shrink-0">D</span>;
}
