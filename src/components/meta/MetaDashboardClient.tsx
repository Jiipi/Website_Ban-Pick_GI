"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Crown, Shield, TrendingUp } from "lucide-react";
import { ELEMENT_COLORS, getCharacterIconUrl } from "@/lib/genshin";

type Character = {
  id: string;
  name: string;
  element: string;
  rarity: number;
};

type CharacterStat = {
  characterId: string;
  pickCount: number;
  banCount: number;
};

type RankedCharacter = Character & {
  pickCount: number;
  banCount: number;
  score: number;
  tier: "S" | "A" | "B" | "C" | "D";
};

const TIER_STYLES: Record<RankedCharacter["tier"], { bg: string; text: string; ring: string }> = {
  S: { bg: "bg-rose-500/15", text: "text-rose-300", ring: "ring-rose-500/30" },
  A: { bg: "bg-amber-500/15", text: "text-amber-300", ring: "ring-amber-500/30" },
  B: { bg: "bg-cyan-500/15", text: "text-cyan-300", ring: "ring-cyan-500/30" },
  C: { bg: "bg-violet-500/15", text: "text-violet-300", ring: "ring-violet-500/30" },
  D: { bg: "bg-slate-700/40", text: "text-slate-300", ring: "ring-slate-700/40" },
};

export function MetaDashboardClient({
  characters,
  stats,
}: {
  characters: Character[];
  stats: CharacterStat[];
}) {
  const [activeTier, setActiveTier] = useState<RankedCharacter["tier"] | "ALL">("ALL");

  const ranked = useMemo(() => {
    const statMap = new Map(stats.map((s) => [s.characterId, s]));
    const maxPresence = Math.max(1, ...stats.map((s) => s.pickCount + s.banCount));

    return characters
      .map((c) => {
        const stat = statMap.get(c.id);
        const pickCount = stat?.pickCount ?? 0;
        const banCount = stat?.banCount ?? 0;
        const score = (pickCount * 0.65 + banCount * 0.35) / maxPresence;
        let tier: RankedCharacter["tier"] = "D";
        if (score >= 0.45) tier = "S";
        else if (score >= 0.25) tier = "A";
        else if (score >= 0.12) tier = "B";
        else if (score > 0) tier = "C";
        return { ...c, pickCount, banCount, score, tier };
      })
      .sort((a, b) => b.score - a.score || b.pickCount - a.pickCount || a.name.localeCompare(b.name));
  }, [characters, stats]);

  const totalPicks = stats.reduce((sum, s) => sum + s.pickCount, 0);
  const totalBans = stats.reduce((sum, s) => sum + s.banCount, 0);
  const trackedCharacters = ranked.filter((c) => c.pickCount + c.banCount > 0).length;
  const topPick = ranked.reduce<RankedCharacter | null>((best, c) => (!best || c.pickCount > best.pickCount ? c : best), null);
  const topBan = ranked.reduce<RankedCharacter | null>((best, c) => (!best || c.banCount > best.banCount ? c : best), null);

  const visible = activeTier === "ALL" ? ranked : ranked.filter((c) => c.tier === activeTier);

  return (
    <div className="space-y-5 animate-fade-in-up delay-100">
      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tracked picks" value={totalPicks} icon={<TrendingUp size={14} />} accent="cyan" />
        <StatCard label="Tracked bans" value={totalBans} icon={<Shield size={14} />} accent="rose" />
        <StatCard label="Có dữ liệu" value={trackedCharacters} icon={<Crown size={14} />} accent="amber" />
        <StatCard label="Tổng nhân vật" value={characters.length} icon={<TrendingUp size={14} />} accent="violet" />
      </div>

      {/* Methodology */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-300" />
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-amber-200">Phương pháp tính</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Tier dựa trên dữ liệu pick/ban trong hệ thống: score = pick presence × 65% + ban presence × 35%.
              Khi sample ít, tier chỉ nên xem là tham khảo nội bộ giải đấu, không phải meta chính thức của Genshin.
            </p>
          </div>
        </div>
      </div>

      {/* Highlights */}
      <div className="grid gap-3 md:grid-cols-2">
        {topPick && <HighlightCard title="Most Picked" character={topPick} metric={`${topPick.pickCount} picks`} />}
        {topBan && <HighlightCard title="Most Banned" character={topBan} metric={`${topBan.banCount} bans`} />}
      </div>

      {/* Tier filters */}
      <div className="glass-strong rounded-2xl p-4">
        <div className="flex flex-wrap gap-2">
          {(["ALL", "S", "A", "B", "C", "D"] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setActiveTier(tier)}
              className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors ${
                activeTier === tier
                  ? tier === "ALL"
                    ? "bg-slate-700/70 text-slate-100"
                    : `${TIER_STYLES[tier].bg} ${TIER_STYLES[tier].text} ring-1 ${TIER_STYLES[tier].ring}`
                  : "bg-slate-800/40 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
              }`}
            >
              {tier === "ALL" ? "Tất cả" : `Tier ${tier}`}
            </button>
          ))}
        </div>
      </div>

      {/* Tier sections */}
      <div className="space-y-4">
        {(["S", "A", "B", "C", "D"] as const)
          .filter((tier) => activeTier === "ALL" || activeTier === tier)
          .map((tier) => {
            const items = visible.filter((c) => c.tier === tier);
            if (items.length === 0) return null;
            return (
              <section key={tier} className={`glass-strong rounded-3xl p-5 ring-1 ${TIER_STYLES[tier].ring}`}>
                <div className="mb-4 flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-2xl text-xl font-black ${TIER_STYLES[tier].bg} ${TIER_STYLES[tier].text}`}>
                    {tier}
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-slate-100">Tier {tier}</h2>
                    <p className="text-xs text-slate-500">{items.length} nhân vật</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((c) => (
                    <CharacterMetaCard key={c.id} character={c} />
                  ))}
                </div>
              </section>
            );
          })}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: "cyan" | "rose" | "amber" | "violet";
}) {
  const map = {
    cyan: "text-cyan-300 bg-cyan-500/10",
    rose: "text-rose-300 bg-rose-500/10",
    amber: "text-amber-300 bg-amber-500/10",
    violet: "text-violet-300 bg-violet-500/10",
  };
  return (
    <div className="glass-strong rounded-2xl p-4">
      <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-xl ${map[accent]}`}>{icon}</div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 font-mono text-3xl font-black tabular-nums text-slate-100">{value}</p>
    </div>
  );
}

function HighlightCard({ character, title, metric }: { character: RankedCharacter; title: string; metric: string }) {
  return (
    <Link href={`/characters/${character.id}`} className="glass-strong block rounded-2xl p-4 transition-transform hover:scale-[1.01]">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{title}</p>
      <div className="mt-3 flex items-center gap-3">
        <Image
          src={getCharacterIconUrl(character.id)}
          alt={character.name}
          width={56}
          height={56}
          className="rounded-xl bg-slate-800/60"
          unoptimized
        />
        <div>
          <p className="text-sm font-bold text-slate-100">{character.name}</p>
          <p className="text-xs text-slate-400">{metric}</p>
        </div>
      </div>
    </Link>
  );
}

function CharacterMetaCard({ character }: { character: RankedCharacter }) {
  const elementColor = ELEMENT_COLORS[character.element as keyof typeof ELEMENT_COLORS] ?? "#94A3B8";
  return (
    <Link
      href={`/characters/${character.id}`}
      className="rounded-2xl border border-slate-700/40 bg-slate-900/40 p-3 transition-colors hover:border-cyan-500/30 hover:bg-slate-800/40"
    >
      <div className="flex items-center gap-3">
        <Image
          src={getCharacterIconUrl(character.id)}
          alt={character.name}
          width={52}
          height={52}
          className="rounded-xl bg-slate-800/60"
          unoptimized
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-100">{character.name}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider"
              style={{ backgroundColor: `${elementColor}22`, color: elementColor }}
            >
              {character.element}
            </span>
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
              {"★".repeat(character.rarity)}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-slate-950/40 py-1.5">
          <p className="font-mono text-sm font-black text-cyan-300">{character.pickCount}</p>
          <p className="text-[9px] text-slate-500">Pick</p>
        </div>
        <div className="rounded-lg bg-slate-950/40 py-1.5">
          <p className="font-mono text-sm font-black text-rose-300">{character.banCount}</p>
          <p className="text-[9px] text-slate-500">Ban</p>
        </div>
        <div className="rounded-lg bg-slate-950/40 py-1.5">
          <p className="font-mono text-sm font-black text-amber-300">{Math.round(character.score * 100)}</p>
          <p className="text-[9px] text-slate-500">Score</p>
        </div>
      </div>
    </Link>
  );
}
