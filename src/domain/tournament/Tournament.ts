// ── Tournament domain types ──

export type TournamentFormat = "SINGLE_ELIM" | "DOUBLE_ELIM" | "ROUND_ROBIN";
export type TournamentStatus = "UPCOMING" | "ONGOING" | "FINISHED" | "CANCELLED";

export type TournamentRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  format: TournamentFormat;
  status: TournamentStatus;
  maxTeams: number;
  startDate: Date | null;
  endDate: Date | null;
  organizerId: string | null;
  organizerName: string | null;
  bannerUrl: string | null;
  prizeInfo: string | null;
  participantCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ParticipantRecord = {
  id: string;
  tournamentId: string;
  playerUid: string;
  playerNickname: string;
  playerAvatarUrl: string | null;
  seed: number | null;
  eliminated: boolean;
  joinedAt: Date;
};

export type MatchRecord = {
  id: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  blueParticipantId: string | null;
  redParticipantId: string | null;
  winnerParticipantId: string | null;
  roomCode: string | null;
  scheduledAt: Date | null;
  completedAt: Date | null;
};

/**
 * Generate single-elimination bracket matches for N participants.
 * Returns match stubs per round. Handles BYEs for non-power-of-2 counts.
 */
export function generateSingleElimBracket(
  participants: ParticipantRecord[],
): Omit<MatchRecord, "id" | "tournamentId" | "roomCode" | "scheduledAt" | "completedAt">[] {
  const n = participants.length;
  if (n < 2) return [];

  // Round up to nearest power of 2
  const bracketSize = nextPowerOf2(n);
  const totalRounds = Math.log2(bracketSize);

  // Sort by seed (nulls last)
  const seeded = [...participants].sort((a, b) => {
    if (a.seed == null && b.seed == null) return 0;
    if (a.seed == null) return 1;
    if (b.seed == null) return -1;
    return a.seed - b.seed;
  });

  // Place into bracket positions using standard seeding (1v8, 4v5, 2v7, 3v6)
  const slots: (ParticipantRecord | null)[] = new Array(bracketSize).fill(null);
  const order = seedOrder(bracketSize);
  for (let i = 0; i < seeded.length; i++) {
    slots[order[i]] = seeded[i];
  }

  const matches: Omit<MatchRecord, "id" | "tournamentId" | "roomCode" | "scheduledAt" | "completedAt">[] = [];

  // Round 1
  for (let m = 0; m < bracketSize / 2; m++) {
    const blue = slots[m * 2];
    const red = slots[m * 2 + 1];

    // If one side is BYE, auto-advance
    const isBye = !blue || !red;
    const winner = isBye ? (blue ?? red) : null;

    matches.push({
      round: 1,
      matchNumber: m,
      blueParticipantId: blue?.id ?? null,
      redParticipantId: red?.id ?? null,
      winnerParticipantId: winner?.id ?? null,
    });
  }

  // Later rounds (empty, winners will advance)
  for (let r = 2; r <= totalRounds; r++) {
    const matchesInRound = bracketSize / Math.pow(2, r);
    for (let m = 0; m < matchesInRound; m++) {
      matches.push({
        round: r,
        matchNumber: m,
        blueParticipantId: null,
        redParticipantId: null,
        winnerParticipantId: null,
      });
    }
  }

  return matches;
}

/**
 * After a match finishes, propagate winner to the next round.
 */
export function getNextMatchSlot(
  round: number,
  matchNumber: number,
): { round: number; matchNumber: number; slot: "blue" | "red" } {
  return {
    round: round + 1,
    matchNumber: Math.floor(matchNumber / 2),
    slot: matchNumber % 2 === 0 ? "blue" : "red",
  };
}

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * Standard tournament seeding order.
 * For 8 slots: [0, 7, 3, 4, 1, 6, 2, 5] — seed 1 vs seed 8, etc.
 */
function seedOrder(size: number): number[] {
  if (size === 1) return [0];
  const half = seedOrder(size / 2);
  const result: number[] = [];
  for (const h of half) {
    result.push(h);
    result.push(size - 1 - h);
  }
  return result;
}

/**
 * Generate double-elimination bracket.
 * Uses rounds with negative numbers for losers bracket,
 * and a grand final round.
 */
export function generateDoubleElimBracket(
  participants: ParticipantRecord[],
): Omit<MatchRecord, "id" | "tournamentId" | "roomCode" | "scheduledAt" | "completedAt">[] {
  // Step 1: Generate upper bracket (same as single elim)
  const upperMatches = generateSingleElimBracket(participants);
  const upperRounds = Math.max(...upperMatches.map((m) => m.round));

  // Step 2: Generate losers bracket
  // In double-elim, losers bracket has (2 * upperRounds - 1) rounds
  const losersMatches: Omit<MatchRecord, "id" | "tournamentId" | "roomCode" | "scheduledAt" | "completedAt">[] = [];
  const losersRounds = upperRounds * 2 - 1;
  let matchesInRound = Math.max(1, Math.floor(participants.length / 4));

  for (let r = 1; r <= losersRounds; r++) {
    for (let m = 0; m < matchesInRound; m++) {
      losersMatches.push({
        round: -(r),  // Negative rounds = losers bracket
        matchNumber: m,
        blueParticipantId: null,
        redParticipantId: null,
        winnerParticipantId: null,
      });
    }
    // Every other round halves the matches
    if (r % 2 === 0) {
      matchesInRound = Math.max(1, Math.floor(matchesInRound / 2));
    }
  }

  // Step 3: Grand final (round = upperRounds + 1)
  const grandFinal = {
    round: upperRounds + 1,
    matchNumber: 0,
    blueParticipantId: null as string | null,
    redParticipantId: null as string | null,
    winnerParticipantId: null as string | null,
  };

  return [...upperMatches, ...losersMatches, grandFinal];
}

/**
 * Generate round-robin bracket (all-vs-all).
 * Each participant plays every other participant once.
 * All matches are in round 1.
 */
export function generateRoundRobinBracket(
  participants: ParticipantRecord[],
): Omit<MatchRecord, "id" | "tournamentId" | "roomCode" | "scheduledAt" | "completedAt">[] {
  const matches: Omit<MatchRecord, "id" | "tournamentId" | "roomCode" | "scheduledAt" | "completedAt">[] = [];
  let matchNum = 0;
  const seeded = [...participants].sort((a, b) => {
    if (a.seed == null && b.seed == null) return 0;
    if (a.seed == null) return 1;
    if (b.seed == null) return -1;
    return a.seed - b.seed;
  });

  // Calculate round-robin rounds using circle method
  const n = seeded.length;
  const rounds = n % 2 === 0 ? n - 1 : n;

  for (let r = 0; r < rounds; r++) {
    const roundMatches: { blue: ParticipantRecord; red: ParticipantRecord }[] = [];
    const fixed = seeded[0];
    const rotating = seeded.slice(1);

    // Rotate
    const rotated = [...rotating.slice(r % rotating.length), ...rotating.slice(0, r % rotating.length)];

    // Pair up
    const all = [fixed, ...rotated];
    const half = Math.floor(all.length / 2);
    for (let i = 0; i < half; i++) {
      roundMatches.push({ blue: all[i], red: all[all.length - 1 - i] });
    }

    for (const rm of roundMatches) {
      matches.push({
        round: r + 1,
        matchNumber: matchNum++,
        blueParticipantId: rm.blue.id,
        redParticipantId: rm.red.id,
        winnerParticipantId: null,
      });
    }
  }

  return matches;
}
