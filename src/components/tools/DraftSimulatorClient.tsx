"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { ELEMENT_COLORS, getCharacterIconUrl } from "@/lib/genshin";

type Character = { id: string; name: string; element: string; rarity: number };
type TeamSide = "BLUE" | "RED";
type DraftAction = "BAN" | "PICK";
type DraftLog = { player: string; action: string; characterId: string };
type Phase = "select-team" | "drafting" | "finished";

type Props = { characters: Character[] };

const DRAFT_TURNS: { turn: number; player: TeamSide; action: DraftAction }[] = [
  { turn: 1, player: "BLUE", action: "BAN" },
  { turn: 2, player: "RED", action: "BAN" },
  { turn: 3, player: "BLUE", action: "BAN" },
  { turn: 4, player: "RED", action: "BAN" },
  { turn: 5, player: "BLUE", action: "PICK" },
  { turn: 6, player: "RED", action: "PICK" },
  { turn: 7, player: "RED", action: "PICK" },
  { turn: 8, player: "BLUE", action: "PICK" },
  { turn: 9, player: "BLUE", action: "PICK" },
  { turn: 10, player: "RED", action: "PICK" },
  { turn: 11, player: "RED", action: "BAN" },
  { turn: 12, player: "BLUE", action: "BAN" },
  { turn: 13, player: "RED", action: "PICK" },
  { turn: 14, player: "BLUE", action: "PICK" },
  { turn: 15, player: "BLUE", action: "PICK" },
  { turn: 16, player: "RED", action: "PICK" },
  { turn: 17, player: "RED", action: "PICK" },
  { turn: 18, player: "BLUE", action: "PICK" },
  { turn: 19, player: "BLUE", action: "PICK" },
  { turn: 20, player: "RED", action: "PICK" },
  { turn: 21, player: "RED", action: "PICK" },
  { turn: 22, player: "BLUE", action: "PICK" },
];

export function DraftSimulatorClient({ characters }: Props) {
  const [userTeam, setUserTeam] = useState<TeamSide>("BLUE");
  const [logs, setLogs] = useState<DraftLog[]>([]);
  const [phase, setPhase] = useState<Phase>("select-team");
  const [search, setSearch] = useState("");

  const characterById = useMemo(() => new Map(characters.map((character) => [character.id, character])), [characters]);
  const unavailable = useMemo(() => new Set(logs.map((log) => log.characterId)), [logs]);
  const currentTurn = DRAFT_TURNS[logs.length];
  const isUserTurn = phase === "drafting" && currentTurn?.player === userTeam;

  const filteredCharacters = useMemo(() => {
    const query = search.trim().toLowerCase();
    return characters.filter((character) => !query || character.name.toLowerCase().includes(query));
  }, [characters, search]);

  const blueBans = logs.filter((log) => log.player === "BLUE" && log.action === "BAN");
  const redBans = logs.filter((log) => log.player === "RED" && log.action === "BAN");
  const bluePicks = logs.filter((log) => log.player === "BLUE" && log.action === "PICK");
  const redPicks = logs.filter((log) => log.player === "RED" && log.action === "PICK");

  useEffect(() => {
    if (phase !== "drafting" || !currentTurn || currentTurn.player === userTeam) return;

    const timer = window.setTimeout(() => {
      const available = characters.filter((character) => !unavailable.has(character.id));
      if (available.length === 0) return;
      const picked = available[Math.floor(Math.random() * available.length)];
      setLogs((prev) => {
        const nextLogs = [...prev, { player: currentTurn.player, action: currentTurn.action, characterId: picked.id }];
        if (nextLogs.length >= DRAFT_TURNS.length) setPhase("finished");
        return nextLogs;
      });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [characters, currentTurn, phase, unavailable, userTeam]);

  function completeTurn(characterId: string) {
    if (!currentTurn || unavailable.has(characterId)) return;
    setLogs((prev) => {
      const nextLogs = [...prev, { player: currentTurn.player, action: currentTurn.action, characterId }];
      if (nextLogs.length >= DRAFT_TURNS.length) setPhase("finished");
      return nextLogs;
    });
  }

  function chooseTeam(team: TeamSide) {
    setUserTeam(team);
    setLogs([]);
    setSearch("");
    setPhase("drafting");
  }

  function restart() {
    setUserTeam("BLUE");
    setLogs([]);
    setSearch("");
    setPhase("select-team");
  }

  if (phase === "select-team") {
    return (
      <section className="glass-strong rounded-3xl p-6 sm:p-8 animate-fade-in-up delay-100">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-amber-300">Draft setup</p>
        <h2 className="mt-2 text-2xl font-black text-slate-100">Chọn đội</h2>
        <p className="mt-2 text-sm text-slate-400">Bạn điều khiển một đội, bot sẽ tự động ban/pick cho đội còn lại.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <button type="button" onClick={() => chooseTeam("BLUE")} className="rounded-3xl border border-cyan-400/30 bg-cyan-500/10 p-8 text-left transition hover:border-cyan-300/70 hover:bg-cyan-500/20">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-300">Blue side</p>
            <p className="mt-2 text-3xl font-black text-slate-100">Đội Xanh</p>
          </button>
          <button type="button" onClick={() => chooseTeam("RED")} className="rounded-3xl border border-rose-400/30 bg-rose-500/10 p-8 text-left transition hover:border-rose-300/70 hover:bg-rose-500/20">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-rose-300">Red side</p>
            <p className="mt-2 text-3xl font-black text-slate-100">Đội Đỏ</p>
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="glass-strong rounded-3xl p-5 sm:p-6 animate-fade-in-up delay-100">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-amber-300">Draft simulator</p>
            {phase === "finished" ? (
              <h2 className="mt-1 text-2xl font-black text-slate-100">Draft hoàn tất</h2>
            ) : (
              <h2 className="mt-1 text-2xl font-black text-slate-100">
                Turn {currentTurn.turn}/22 · {teamLabel(currentTurn.player)} · {currentTurn.action}
              </h2>
            )}
            <p className="mt-2 text-sm text-slate-400">
              Bạn đang chơi <span className={userTeam === "BLUE" ? "font-bold text-cyan-300" : "font-bold text-rose-300"}>{teamLabel(userTeam)}</span>
              {phase === "drafting" && (isUserTurn ? " · Đến lượt bạn chọn." : " · Bot đang suy nghĩ...")}
            </p>
          </div>
          <button type="button" onClick={restart} className="btn-outline self-start lg:self-auto">
            <RotateCcw size={14} />
            Restart
          </button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <DraftSide title="Đội Xanh" accent="cyan" bans={blueBans} picks={bluePicks} characterById={characterById} />
        <DraftSide title="Đội Đỏ" accent="rose" bans={redBans} picks={redPicks} characterById={characterById} />
      </div>

      {phase === "finished" ? (
        <section className="glass-strong rounded-3xl p-5 sm:p-6 animate-fade-in-up delay-300">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-400">Summary</p>
          <h2 className="mt-1 text-xl font-black text-slate-100">Kết quả draft</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <PickSummary title="Blue picks" picks={bluePicks} characterById={characterById} />
            <PickSummary title="Red picks" picks={redPicks} characterById={characterById} />
          </div>
        </section>
      ) : (
        <section className="glass-strong rounded-3xl p-5 sm:p-6 animate-fade-in-up delay-300">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-400">Character grid</p>
              <h2 className="mt-1 text-xl font-black text-slate-100">{isUserTurn ? "Chọn nhân vật" : "Chờ bot chọn"}</h2>
            </div>
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm nhân vật..." className="input-field w-full pl-9 sm:w-72" />
            </div>
          </div>

          <div className="grid max-h-[560px] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {filteredCharacters.map((character) => {
              const disabled = unavailable.has(character.id) || !isUserTurn;
              return (
                <button
                  key={character.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => completeTurn(character.id)}
                  className="relative rounded-2xl border border-slate-700/50 bg-slate-900/45 p-3 text-left transition hover:border-amber-400/50 hover:bg-amber-500/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-slate-800/80">
                    <Image src={getCharacterIconUrl(character.id)} alt={character.name} width={64} height={64} unoptimized />
                  </div>
                  <p className="mt-2 line-clamp-2 min-h-10 text-center text-xs font-black text-slate-100">{character.name}</p>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <ElementBadge element={character.element} />
                    <span className="text-[10px] font-bold text-amber-200">{character.rarity}★</span>
                  </div>
                  {unavailable.has(character.id) && <span className="absolute inset-0 rounded-2xl bg-slate-950/35" />}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function DraftSide({ title, accent, bans, picks, characterById }: { title: string; accent: "cyan" | "rose"; bans: DraftLog[]; picks: DraftLog[]; characterById: Map<string, Character> }) {
  const titleClass = accent === "cyan" ? "text-cyan-300" : "text-rose-300";
  const borderClass = accent === "cyan" ? "border-cyan-500/25" : "border-rose-500/25";

  return (
    <section className={`glass-strong rounded-3xl border ${borderClass} p-5 sm:p-6 animate-fade-in-up delay-200`}>
      <h2 className={`text-xl font-black ${titleClass}`}>{title}</h2>
      <div className="mt-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Bans</p>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }, (_, index) => <MiniCharacter key={index} log={bans[index]} characterById={characterById} banned />)}
        </div>
      </div>
      <div className="mt-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Picks</p>
        <div className="space-y-2">
          {Array.from({ length: 8 }, (_, index) => <PickRow key={index} log={picks[index]} characterById={characterById} index={index + 1} />)}
        </div>
      </div>
    </section>
  );
}

function MiniCharacter({ log, characterById, banned }: { log?: DraftLog; characterById: Map<string, Character>; banned?: boolean }) {
  const character = log ? characterById.get(log.characterId) : null;
  return (
    <div className="relative min-h-24 rounded-2xl border border-slate-700/40 bg-slate-900/40 p-2 text-center">
      {character ? (
        <>
          <Image src={getCharacterIconUrl(character.id)} alt={character.name} width={48} height={48} className="mx-auto rounded-xl bg-slate-800" unoptimized />
          <p className="mt-1 line-clamp-1 text-[11px] font-bold text-slate-200">{character.name}</p>
          {banned && <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-rose-950/25 text-3xl font-black text-rose-300">×</span>}
        </>
      ) : (
        <div className="flex h-full min-h-20 items-center justify-center text-[11px] font-bold uppercase tracking-wider text-slate-600">Empty</div>
      )}
    </div>
  );
}

function PickRow({ log, characterById, index }: { log?: DraftLog; characterById: Map<string, Character>; index: number }) {
  const character = log ? characterById.get(log.characterId) : null;
  return (
    <div className="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-700/40 bg-slate-900/40 p-2">
      <span className="w-6 text-center font-mono text-xs font-black text-slate-500">{index}</span>
      {character ? (
        <>
          <Image src={getCharacterIconUrl(character.id)} alt={character.name} width={48} height={48} className="rounded-xl bg-slate-800" unoptimized />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-slate-100">{character.name}</p>
            <div className="mt-1 flex items-center gap-2">
              <ElementBadge element={character.element} />
              <span className="text-[10px] font-bold text-amber-200">{character.rarity}★</span>
            </div>
          </div>
        </>
      ) : (
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Pick slot</span>
      )}
    </div>
  );
}

function PickSummary({ title, picks, characterById }: { title: string; picks: DraftLog[]; characterById: Map<string, Character> }) {
  return (
    <div className="rounded-2xl border border-slate-700/40 bg-slate-900/40 p-4">
      <p className="mb-3 text-sm font-black text-slate-100">{title}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {picks.map((pick, index) => <PickRow key={`${pick.characterId}-${index}`} log={pick} characterById={characterById} index={index + 1} />)}
      </div>
    </div>
  );
}

function ElementBadge({ element }: { element: string }) {
  const color = ELEMENT_COLORS[element as keyof typeof ELEMENT_COLORS] ?? "#94a3b8";
  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] font-black text-slate-950" style={{ backgroundColor: color }}>
      {element}
    </span>
  );
}

function teamLabel(team: TeamSide) {
  return team === "BLUE" ? "Đội Xanh" : "Đội Đỏ";
}
