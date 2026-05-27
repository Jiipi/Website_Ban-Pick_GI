"use client";

import { useMemo } from "react";

type Participant = {
  id: string;
  playerNickname: string;
  playerAvatarUrl: string | null;
};

type Match = {
  id: string;
  round: number;
  matchNumber: number;
  blueParticipantId: string | null;
  redParticipantId: string | null;
  winnerParticipantId: string | null;
  roomCode: string | null;
  seriesId?: string | null;
  seriesFormat?: string | null;
};

type BracketViewProps = {
  matches: Match[];
  participants: Participant[];
  isOrganizer: boolean;
  onRecordResult?: (matchId: string, winnerId: string) => void;
};

const MATCH_W = 200;
const MATCH_H = 56;
const ROUND_GAP = 60;
const MATCH_GAP = 24;

function getParticipantName(participants: Participant[], id: string | null): string {
  if (!id) return "TBD";
  const p = participants.find((pp) => pp.id === id);
  return p?.playerNickname ?? "—";
}

export function BracketView({ matches, participants, isOrganizer, onRecordResult }: BracketViewProps) {
  const rounds = useMemo(() => {
    const roundMap = new Map<number, Match[]>();
    for (const m of matches) {
      if (!roundMap.has(m.round)) roundMap.set(m.round, []);
      roundMap.get(m.round)!.push(m);
    }
    for (const [, ms] of roundMap) {
      ms.sort((a, b) => a.matchNumber - b.matchNumber);
    }
    return [...roundMap.entries()].sort(([a], [b]) => a - b);
  }, [matches]);

  if (rounds.length === 0) {
    return <div style={{ color: "#64748b", textAlign: "center", padding: 40, fontSize: "0.8rem" }}>Chưa có bracket.</div>;
  }

  const totalRounds = rounds.length;
  const maxMatches = rounds[0]?.[1]?.length ?? 1;
  const svgW = totalRounds * (MATCH_W + ROUND_GAP) + 40;
  const svgH = maxMatches * (MATCH_H + MATCH_GAP) + 60;

  const roundLabels = rounds.map(([, ], i) => {
    if (i === totalRounds - 1) return "Final";
    if (i === totalRounds - 2) return "Semi-Final";
    return `Round ${i + 1}`;
  });

  return (
    <div className="bracket-container">
      <svg className="bracket-svg" width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
        {rounds.map(([roundNum, roundMatches], roundIdx) => {
          const colX = 20 + roundIdx * (MATCH_W + ROUND_GAP);
          const matchesInRound = roundMatches.length;
          const totalHeight = matchesInRound * (MATCH_H + MATCH_GAP) - MATCH_GAP;
          const offsetY = (svgH - totalHeight) / 2;

          return (
            <g key={roundNum}>
              <text x={colX + MATCH_W / 2} y={16} textAnchor="middle" className="bracket-round-label">
                {roundLabels[roundIdx]}
              </text>
              {roundMatches.map((match, matchIdx) => {
                const y = offsetY + matchIdx * (MATCH_H + MATCH_GAP);
                const hasWinner = !!match.winnerParticipantId;
                const blueName = getParticipantName(participants, match.blueParticipantId);
                const redName = getParticipantName(participants, match.redParticipantId);
                const blueWin = match.winnerParticipantId === match.blueParticipantId && hasWinner;
                const redWin = match.winnerParticipantId === match.redParticipantId && hasWinner;

                return (
                  <g key={match.id}>
                    <rect x={colX} y={y + 20} width={MATCH_W} height={MATCH_H}
                      className={`bracket-match-rect ${hasWinner ? "has-winner" : ""}`}
                      onClick={() => { if (match.roomCode) window.open(`/room/${match.roomCode}`, "_blank"); }}
                    />
                    <text x={colX + 10} y={y + 42}
                      className={`bracket-player-text ${blueWin ? "is-winner" : ""} ${!match.blueParticipantId ? "is-bye" : ""}`}>
                      {blueWin ? "✓ " : ""}{blueName}
                    </text>
                    <line x1={colX + 5} y1={y + 48} x2={colX + MATCH_W - 5} y2={y + 48} stroke="rgba(148,163,184,0.1)" strokeWidth={1} />
                    <text x={colX + 10} y={y + 66}
                      className={`bracket-player-text ${redWin ? "is-winner" : ""} ${!match.redParticipantId ? "is-bye" : ""}`}>
                      {redWin ? "✓ " : ""}{redName}
                    </text>
                    {match.roomCode && (
                      <text x={colX + MATCH_W - 10} y={y + 42} textAnchor="end" className="bracket-score-text">
                        {hasWinner ? "✓" : "⏳"}
                      </text>
                    )}
                    {roundIdx < totalRounds - 1 && (() => {
                      const nextMatchIdx = Math.floor(matchIdx / 2);
                      const nextMs = rounds[roundIdx + 1]?.[1] ?? [];
                      const nextTotalH = nextMs.length * (MATCH_H + MATCH_GAP) - MATCH_GAP;
                      const nextOffsetY = (svgH - nextTotalH) / 2;
                      const nextY = nextOffsetY + nextMatchIdx * (MATCH_H + MATCH_GAP) + 20 + MATCH_H / 2;
                      const midX = (colX + MATCH_W + 20 + (roundIdx + 1) * (MATCH_W + ROUND_GAP)) / 2;
                      const curY = y + 20 + MATCH_H / 2;
                      return (
                        <path
                          d={`M ${colX + MATCH_W} ${curY} L ${midX} ${curY} L ${midX} ${nextY} L ${20 + (roundIdx + 1) * (MATCH_W + ROUND_GAP)} ${nextY}`}
                          className={`bracket-connector ${hasWinner ? "has-winner" : ""}`}
                        />
                      );
                    })()}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
