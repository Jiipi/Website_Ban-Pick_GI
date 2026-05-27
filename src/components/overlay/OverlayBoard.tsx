"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import { getCharacterIconUrl } from "@/lib/genshin";
import type { GenshinCharacter } from "@/lib/genshin";
import { draftTurns, getCurrentTurn, type DraftEntry } from "@/lib/draft";

type OverlayBoardProps = {
  roomCode: string;
  roomId: string;
  status: string;
  logs: DraftEntry[];
  characters: GenshinCharacter[];
  blueTeamName: string;
  redTeamName: string;
  blueTeamLogo: string | null;
  redTeamLogo: string | null;
  blueTeamColor: string;
  redTeamColor: string;
  bluePlayerName: string | null;
  redPlayerName: string | null;
  blueBankTime: number;
  redBankTime: number;
  lastTurnStartedAt: string | null;
  seriesFormat: string | null;
  gameNumber: number | null;
  spectatorDelay: number;
};

const TOTAL_TURNS = draftTurns.length;

export function OverlayBoard(props: OverlayBoardProps) {
  const {
    roomCode,
    characters,
    blueTeamName,
    redTeamName,
    blueTeamLogo,
    redTeamLogo,
    blueTeamColor,
    redTeamColor,
    blueBankTime,
    redBankTime,
    seriesFormat,
    gameNumber,
  } = props;

  const [logs, setLogs] = useState<DraftEntry[]>(props.logs);
  const [status, setStatus] = useState(props.status);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll for updates every 1s
  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`/api/room/${roomCode}?clientId=overlay`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.room?.logs) setLogs(data.room.logs);
        if (data.room?.status) setStatus(data.room.status);
      } catch { /* ignore */ }
    }
    intervalRef.current = setInterval(poll, 1500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [roomCode]);

  const characterMap = useMemo(() => {
    const m = new Map<string, GenshinCharacter>();
    for (const c of characters) m.set(c.id, c);
    return m;
  }, [characters]);

  const currentTurn = getCurrentTurn(logs);
  const stepNumber = logs.length + 1;
  const bansBlue = logs.filter((l) => l.action === "BAN" && l.player === "BLUE");
  const bansRed = logs.filter((l) => l.action === "BAN" && l.player === "RED");
  const picksBlue = logs.filter((l) => l.action === "PICK" && l.player === "BLUE");
  const picksRed = logs.filter((l) => l.action === "PICK" && l.player === "RED");

  const activeTeam = currentTurn?.player ?? null;
  const activeAction = currentTurn?.action ?? null;
  const turnLabel = currentTurn
    ? `${currentTurn.player} ${currentTurn.action}`
    : status === "FINISHED" ? "FINISHED" : "WAITING";

  return (
    <div
      className="overlay-container"
      style={{
        "--blue-color": blueTeamColor,
        "--red-color": redTeamColor,
      } as React.CSSProperties}
    >
      {/* Top Bar — Team names + score */}
      <div className="overlay-topbar">
        <div className="overlay-team overlay-team-blue">
          {blueTeamLogo && (
            <img src={blueTeamLogo} alt="" className="overlay-team-logo" />
          )}
          <span className="overlay-team-name" style={{ color: blueTeamColor }}>
            {blueTeamName}
          </span>
        </div>

        <div className="overlay-center">
          {seriesFormat && seriesFormat !== "BO1" && (
            <span className="overlay-series">
              {seriesFormat} • Game {gameNumber ?? 1}
            </span>
          )}
          <div className="overlay-step">
            {status === "DRAFTING" ? (
              <>
                <span className="overlay-step-num">
                  {stepNumber}/{TOTAL_TURNS}
                </span>
                <span className={`overlay-step-label ${
                  activeTeam === "BLUE" ? "is-blue" : "is-red"
                } ${activeAction === "BAN" ? "is-ban" : "is-pick"}`}>
                  {turnLabel}
                </span>
              </>
            ) : (
              <span className="overlay-step-label">{status}</span>
            )}
          </div>
        </div>

        <div className="overlay-team overlay-team-red">
          <span className="overlay-team-name" style={{ color: redTeamColor }}>
            {redTeamName}
          </span>
          {redTeamLogo && (
            <img src={redTeamLogo} alt="" className="overlay-team-logo" />
          )}
        </div>
      </div>

      {/* Ban strip */}
      <div className="overlay-bans">
        <div className="overlay-ban-row overlay-ban-blue">
          {bansBlue.map((b, i) => (
            <div key={i} className="overlay-ban-slot">
              <Image
                src={getCharacterIconUrl(b.characterId)}
                alt={b.characterId}
                width={40}
                height={40}
                className="overlay-ban-icon"
                unoptimized
              />
              <div className="overlay-ban-x">✕</div>
            </div>
          ))}
        </div>

        <div className="overlay-timer">
          <span className="overlay-timer-blue">{formatTime(blueBankTime)}</span>
          <span className="overlay-timer-sep">|</span>
          <span className="overlay-timer-red">{formatTime(redBankTime)}</span>
        </div>

        <div className="overlay-ban-row overlay-ban-red">
          {bansRed.map((b, i) => (
            <div key={i} className="overlay-ban-slot">
              <Image
                src={getCharacterIconUrl(b.characterId)}
                alt={b.characterId}
                width={40}
                height={40}
                className="overlay-ban-icon"
                unoptimized
              />
              <div className="overlay-ban-x">✕</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pick columns */}
      <div className="overlay-picks">
        <div className="overlay-pick-col overlay-pick-blue">
          {picksBlue.map((p, i) => {
            const char = characterMap.get(p.characterId);
            return (
              <div key={i} className="overlay-pick-card" style={{ borderColor: blueTeamColor }}>
                <Image
                  src={getCharacterIconUrl(p.characterId)}
                  alt={p.characterId}
                  width={64}
                  height={64}
                  className="overlay-pick-icon"
                  unoptimized
                />
                <span className="overlay-pick-name">{char?.name ?? p.characterId}</span>
              </div>
            );
          })}
        </div>

        <div className="overlay-pick-col overlay-pick-red">
          {picksRed.map((p, i) => {
            const char = characterMap.get(p.characterId);
            return (
              <div key={i} className="overlay-pick-card" style={{ borderColor: redTeamColor }}>
                <Image
                  src={getCharacterIconUrl(p.characterId)}
                  alt={p.characterId}
                  width={64}
                  height={64}
                  className="overlay-pick-icon"
                  unoptimized
                />
                <span className="overlay-pick-name">{char?.name ?? p.characterId}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
