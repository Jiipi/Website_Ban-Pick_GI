import { prisma } from "@/lib/prisma";
import type {
  TournamentRepository,
  CreateTournamentInput,
  AddParticipantInput,
  CreateMatchInput,
  UpdateMatchInput,
} from "@/application/ports/TournamentRepository";
import type {
  MatchRecord,
  ParticipantRecord,
  TournamentRecord,
} from "@/domain/tournament/Tournament";

export class PrismaTournamentRepository implements TournamentRepository {
  // ── Tournament ──

  async listTournaments(filter: { status?: string; format?: string; limit?: number }): Promise<TournamentRecord[]> {
    const where: { status?: string; format?: string } = {};
    if (filter.status) where.status = filter.status;
    if (filter.format) where.format = filter.format;

    const rows = await prisma.tournament.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: "desc" },
      take: filter.limit ?? 50,
      include: { _count: { select: { participants: true } } },
    });

    return rows.map((r) => toTournamentRecord(r, r._count.participants));
  }

  async findTournamentBySlug(slug: string): Promise<TournamentRecord | null> {
    const row = await prisma.tournament.findUnique({
      where: { slug },
      include: { _count: { select: { participants: true } } },
    });
    if (!row) return null;
    return toTournamentRecord(row, row._count.participants);
  }

  async findTournamentById(id: string): Promise<TournamentRecord | null> {
    const row = await prisma.tournament.findUnique({
      where: { id },
      include: { _count: { select: { participants: true } } },
    });
    if (!row) return null;
    return toTournamentRecord(row, row._count.participants);
  }

  async createTournament(input: CreateTournamentInput): Promise<TournamentRecord> {
    const row = await prisma.tournament.create({
      data: {
        slug: input.slug,
        name: input.name,
        description: input.description,
        format: input.format,
        maxTeams: input.maxTeams,
        startDate: input.startDate,
        endDate: input.endDate,
        costCap: input.costCap,
        bankTime: input.bankTime,
        fearlessDraft: input.fearlessDraft,
        patch: input.patch,
        region: input.region,
        rulesText: input.rulesText,
        organizerId: input.organizerId,
        organizerName: input.organizerName,
        bannerUrl: input.bannerUrl,
        prizeInfo: input.prizeInfo,
      },
      include: { _count: { select: { participants: true } } },
    });
    return toTournamentRecord(row, row._count.participants);
  }

  async updateTournamentStatus(id: string, status: string): Promise<void> {
    await prisma.tournament.update({ where: { id }, data: { status } });
  }

  // ── Participant ──

  async listParticipants(tournamentId: string): Promise<ParticipantRecord[]> {
    const rows = await prisma.tournamentParticipant.findMany({
      where: { tournamentId },
      orderBy: { seed: { sort: "asc", nulls: "last" } },
      include: { members: { orderBy: [{ role: "asc" }, { joinedAt: "asc" }] } },
    });
    return rows.map(toParticipantRecord);
  }

  async addParticipant(input: AddParticipantInput): Promise<ParticipantRecord> {
    const row = await prisma.tournamentParticipant.create({
      data: {
        tournamentId: input.tournamentId,
        playerUid: input.playerUid,
        playerNickname: input.playerNickname,
        playerAvatarUrl: input.playerAvatarUrl,
        teamName: input.teamName ?? null,
        logoUrl: input.logoUrl ?? null,
        captainUid: input.captainUid ?? input.playerUid,
        seed: input.seed,
        members: input.members?.length
          ? {
              create: input.members.map((member) => ({
                uid: member.uid,
                nickname: member.nickname,
                avatarUrl: member.avatarUrl,
                arLevel: member.arLevel,
                role: member.role,
              })),
            }
          : undefined,
      },
      include: { members: { orderBy: [{ role: "asc" }, { joinedAt: "asc" }] } },
    });
    return toParticipantRecord(row);
  }

  async removeParticipant(tournamentId: string, playerUid: string): Promise<void> {
    await prisma.tournamentParticipant.deleteMany({
      where: { tournamentId, playerUid },
    });
  }

  // ── Match ──

  async listMatches(tournamentId: string): Promise<MatchRecord[]> {
    const rows = await prisma.tournamentMatch.findMany({
      where: { tournamentId },
      orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
    });
    return rows.map(toMatchRecord);
  }

  async findMatchById(matchId: string): Promise<MatchRecord | null> {
    const row = await prisma.tournamentMatch.findUnique({ where: { id: matchId } });
    if (!row) return null;
    return toMatchRecord(row);
  }

  async createMatches(inputs: CreateMatchInput[]): Promise<MatchRecord[]> {
    // Prisma createMany doesn't return created rows on all DBs, so use transaction
    const rows = await prisma.$transaction(
      inputs.map((input) =>
        prisma.tournamentMatch.create({
          data: {
            tournamentId: input.tournamentId,
            round: input.round,
            matchNumber: input.matchNumber,
            blueParticipantId: input.blueParticipantId,
            redParticipantId: input.redParticipantId,
            winnerParticipantId: input.winnerParticipantId,
          },
        }),
      ),
    );
    return rows.map(toMatchRecord);
  }

  async updateMatch(input: UpdateMatchInput): Promise<MatchRecord> {
    const data: Record<string, unknown> = {};
    if (input.blueParticipantId !== undefined) data.blueParticipantId = input.blueParticipantId;
    if (input.redParticipantId !== undefined) data.redParticipantId = input.redParticipantId;
    if (input.winnerParticipantId !== undefined) data.winnerParticipantId = input.winnerParticipantId;
    if (input.roomCode !== undefined) data.roomCode = input.roomCode;
    if (input.seriesId !== undefined) data.seriesId = input.seriesId;
    if (input.seriesFormat !== undefined) data.seriesFormat = input.seriesFormat;
    if (input.completedAt !== undefined) data.completedAt = input.completedAt;

    const row = await prisma.tournamentMatch.update({
      where: { id: input.matchId },
      data,
    });
    return toMatchRecord(row);
  }

  async deleteMatchesByTournament(tournamentId: string): Promise<void> {
    await prisma.tournamentMatch.deleteMany({ where: { tournamentId } });
  }
}

// ── Mappers ──

function toTournamentRecord(row: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  format: string;
  status: string;
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
  createdAt: Date;
  updatedAt: Date;
}, participantCount: number): TournamentRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    format: row.format as TournamentRecord["format"],
    status: row.status as TournamentRecord["status"],
    maxTeams: row.maxTeams,
    startDate: row.startDate,
    endDate: row.endDate,
    costCap: row.costCap,
    bankTime: row.bankTime,
    fearlessDraft: row.fearlessDraft,
    patch: row.patch,
    region: row.region,
    rulesText: row.rulesText,
    organizerId: row.organizerId,
    organizerName: row.organizerName,
    bannerUrl: row.bannerUrl,
    prizeInfo: row.prizeInfo,
    participantCount: participantCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toParticipantRecord(row: {
  id: string;
  tournamentId: string;
  playerUid: string;
  playerNickname: string;
  playerAvatarUrl: string | null;
  teamName: string | null;
  logoUrl: string | null;
  captainUid: string | null;
  seed: number | null;
  eliminated: boolean;
  joinedAt: Date;
  members?: Array<{
    id: string;
    participantId: string;
    uid: string;
    nickname: string;
    avatarUrl: string | null;
    arLevel: number | null;
    role: string;
    joinedAt: Date;
  }>;
}): ParticipantRecord {
  return {
    id: row.id,
    tournamentId: row.tournamentId,
    playerUid: row.playerUid,
    playerNickname: row.playerNickname,
    playerAvatarUrl: row.playerAvatarUrl,
    teamName: row.teamName,
    logoUrl: row.logoUrl,
    captainUid: row.captainUid,
    seed: row.seed,
    eliminated: row.eliminated,
    joinedAt: row.joinedAt,
    members: row.members,
  };
}

function toMatchRecord(row: {
  id: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  blueParticipantId: string | null;
  redParticipantId: string | null;
  winnerParticipantId: string | null;
  roomCode: string | null;
  seriesId: string | null;
  seriesFormat: string | null;
  scheduledAt: Date | null;
  completedAt: Date | null;
}): MatchRecord {
  return { ...row };
}
