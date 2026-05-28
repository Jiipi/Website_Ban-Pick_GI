import type {
  MatchRecord,
  ParticipantRecord,
  TournamentRecord,
} from "@/domain/tournament/Tournament";

export type CreateTournamentInput = {
  slug: string;
  name: string;
  description: string | null;
  format: "SINGLE_ELIM" | "DOUBLE_ELIM" | "ROUND_ROBIN";
  maxTeams: number;
  startDate: Date | null;
  endDate: Date | null;
  costCap: number;
  bankTime: number;
  fearlessDraft: boolean;
  patch: string | null;
  region: string | null;
  rulesText: string | null;
  organizerId: string | null;
  organizerName: string | null;
  bannerUrl: string | null;
  prizeInfo: string | null;
};

export type AddParticipantInput = {
  tournamentId: string;
  playerUid: string;
  playerNickname: string;
  playerAvatarUrl: string | null;
  teamName?: string | null;
  logoUrl?: string | null;
  captainUid?: string | null;
  members?: Array<{
    uid: string;
    nickname: string;
    avatarUrl: string | null;
    arLevel: number | null;
    role: "CAPTAIN" | "PLAYER";
  }>;
  seed: number | null;
};

export type CreateMatchInput = {
  tournamentId: string;
  round: number;
  matchNumber: number;
  blueParticipantId: string | null;
  redParticipantId: string | null;
  winnerParticipantId: string | null;
};

export type UpdateMatchInput = {
  matchId: string;
  blueParticipantId?: string | null;
  redParticipantId?: string | null;
  winnerParticipantId?: string | null;
  roomCode?: string | null;
  seriesId?: string | null;
  seriesFormat?: string | null;
  completedAt?: Date | null;
};

export interface TournamentRepository {
  listTournaments(filter: { status?: string; format?: string; limit?: number }): Promise<TournamentRecord[]>;
  findTournamentBySlug(slug: string): Promise<TournamentRecord | null>;
  findTournamentById(id: string): Promise<TournamentRecord | null>;
  createTournament(input: CreateTournamentInput): Promise<TournamentRecord>;
  updateTournamentStatus(id: string, status: string): Promise<void>;

  listParticipants(tournamentId: string): Promise<ParticipantRecord[]>;
  addParticipant(input: AddParticipantInput): Promise<ParticipantRecord>;
  removeParticipant(tournamentId: string, playerUid: string): Promise<void>;

  listMatches(tournamentId: string): Promise<MatchRecord[]>;
  findMatchById(matchId: string): Promise<MatchRecord | null>;
  createMatches(inputs: CreateMatchInput[]): Promise<MatchRecord[]>;
  updateMatch(input: UpdateMatchInput): Promise<MatchRecord>;
  deleteMatchesByTournament(tournamentId: string): Promise<void>;
}
