"use client";

import Link from "next/link";
import { Trophy, Medal, Award } from "lucide-react";

type Player = {
  uid: string;
  nickname: string;
  avatarUrl: string | null;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
};

export function LeaderboardClient({ players }: { players: Player[] }) {
  if (players.length === 0) {
    return (
      <div className="glass-strong rounded-3xl py-16 text-center">
        <p className="text-4xl">🏆</p>
        <p className="mt-3 font-bold text-slate-300">Chưa có dữ liệu xếp hạng</p>
        <p className="mt-1 text-sm text-slate-500">Hoàn tất trận đấu đầu tiên để bắt đầu bảng xếp hạng.</p>
      </div>
    );
  }

  return (
    <div className="glass-strong rounded-3xl overflow-hidden animate-fade-in-up delay-100">
      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/40">
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 w-12">#</th>
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Player</th>
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Trận</th>
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Thắng</th>
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.3em] text-rose-400">Thua</th>
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">Hoà</th>
              <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Win%</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, idx) => (
              <tr key={p.uid} className="group border-b border-slate-800/40 transition-colors hover:bg-slate-800/20">
                <td className="px-4 py-3 text-center">
                  <RankBadge rank={idx + 1} />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/players/${p.uid}`} className="flex items-center gap-3 group/link">
                    {p.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.avatarUrl}
                        alt={p.nickname}
                        className="h-9 w-9 rounded-full border border-slate-700/60 object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-slate-500">
                        {p.nickname.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-slate-200 truncate group-hover/link:text-cyan-300 transition-colors">
                        {p.nickname}
                      </p>
                      <p className="font-mono text-[10px] text-slate-500">UID: {p.uid}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 text-center font-mono font-bold text-slate-300 tabular-nums">{p.totalMatches}</td>
                <td className="px-4 py-3 text-center font-mono font-bold text-emerald-300 tabular-nums">{p.wins}</td>
                <td className="px-4 py-3 text-center font-mono font-bold text-rose-300 tabular-nums">{p.losses}</td>
                <td className="px-4 py-3 text-center font-mono font-bold text-amber-300 tabular-nums">{p.draws}</td>
                <td className="px-4 py-3 text-center">
                  <WinRate wins={p.wins} total={p.totalMatches} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden divide-y divide-slate-800/40">
        {players.map((p, idx) => (
          <Link
            key={p.uid}
            href={`/players/${p.uid}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/20 transition-colors"
          >
            <RankBadge rank={idx + 1} />
            {p.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.avatarUrl} alt={p.nickname} className="h-9 w-9 rounded-full border border-slate-700/60 object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-slate-500">
                {p.nickname.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-200 truncate">{p.nickname}</p>
              <div className="flex gap-2 text-[10px] tabular-nums">
                <span className="text-emerald-300">{p.wins}W</span>
                <span className="text-rose-300">{p.losses}L</span>
                <span className="text-amber-300">{p.draws}D</span>
              </div>
            </div>
            <WinRate wins={p.wins} total={p.totalMatches} />
          </Link>
        ))}
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy size={18} className="text-amber-400 mx-auto" />;
  if (rank === 2) return <Medal size={18} className="text-slate-300 mx-auto" />;
  if (rank === 3) return <Award size={18} className="text-amber-600 mx-auto" />;
  return <span className="font-mono text-xs font-bold text-slate-500">{rank}</span>;
}

function WinRate({ wins, total }: { wins: number; total: number }) {
  const rate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const color = rate >= 60 ? "text-emerald-300" : rate >= 40 ? "text-amber-300" : "text-rose-300";
  return (
    <span className={`font-mono text-sm font-black tabular-nums ${color}`}>
      {rate}%
    </span>
  );
}
