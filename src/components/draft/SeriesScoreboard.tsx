"use client";

import { useEffect, useState } from "react";
import type { SeriesState } from "@/domain/series/SeriesPolicy";

type SeriesScoreboardProps = {
  roomCode: string;
  clientId: string;
  isHost: boolean;
  seriesId: string | null;
  seriesFormat: string | null;
  gameNumber: number | null;
};

export function SeriesScoreboard({
  roomCode,
  clientId,
  isHost,
  seriesId,
  seriesFormat,
  gameNumber,
}: SeriesScoreboardProps) {
  const [state, setState] = useState<SeriesState | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!seriesId) return;
    fetch(`/api/room/${roomCode}/series`)
      .then((r) => r.json())
      .then((data) => {
        if (data.series) setState(data.series);
      })
      .catch(() => {});
  }, [roomCode, seriesId]);

  if (!seriesId || !seriesFormat || seriesFormat === "BO1") return null;

  const blueWins = state?.blueWins ?? 0;
  const redWins = state?.redWins ?? 0;
  const format = seriesFormat;
  const currentGame = gameNumber ?? 1;

  async function handleNextGame() {
    setStarting(true);
    try {
      const res = await fetch(`/api/room/${roomCode}/host`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "START_NEXT_GAME", clientId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.room?.code) {
          window.location.href = `/room/${data.room.code}`;
        }
      }
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="series-scoreboard">
      <button
        className="series-score-main"
        onClick={() => setExpanded(!expanded)}
        type="button"
      >
        <span className="series-score-blue">{blueWins}</span>
        <span className="series-score-divider">—</span>
        <span className="series-score-red">{redWins}</span>
        <span className="series-score-format">{format}</span>
        <span className="series-score-game">Game {currentGame}</span>
      </button>

      {expanded && state && (
        <div className="series-games-dropdown">
          {state.games.map((g) => (
            <div
              key={g.gameNumber}
              className={`series-game-row ${g.gameNumber === currentGame ? "is-current" : ""}`}
            >
              <span className="series-game-num">Game {g.gameNumber}</span>
              <span className={`series-game-result ${
                g.winner === "BLUE" ? "is-blue-win" : g.winner === "RED" ? "is-red-win" : ""
              }`}>
                {g.winner ? `${g.winner} WIN` : g.status === "DRAFTING" ? "In Progress" : "—"}
              </span>
              {g.roomCode !== roomCode && (
                <a href={`/room/${g.roomCode}`} className="series-game-link">
                  View →
                </a>
              )}
            </div>
          ))}

          {isHost && state.isFinished && (
            <div className="series-winner-banner">
              🏆 {state.winner} WINS THE SERIES
            </div>
          )}

          {isHost && !state.isFinished && state.games.every((g) => g.winner !== null) && (
            <button
              className="series-next-game-btn"
              onClick={handleNextGame}
              disabled={starting}
              type="button"
            >
              {starting ? "Creating..." : `▶ Start Game ${state.nextGameNumber}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
