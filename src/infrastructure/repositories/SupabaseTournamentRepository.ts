import type {
  AddParticipantInput,
  CreateMatchInput,
  CreateTournamentInput,
  TournamentRepository,
  UpdateMatchInput,
  UpdateTournamentInput,
} from "@/application/ports/TournamentRepository";
import type {
  MatchRecord,
  ParticipantRecord,
  TournamentRecord,
  TournamentStatus,
} from "@/domain/tournament/Tournament";
import {
  cleanForSupabase,
  newId,
  nowIso,
  optionalCount,
  optionalRows,
  requireRow,
  supabase,
  toDate,
  toNullableDate,
  type DbRow,
} from "@/infrastructure/repositories/SupabaseRepositoryUtils";

export class SupabaseTournamentRepository implements TournamentRepository {
  async listTournaments(filter: { status?: string; format?: string; limit?: number }): Promise<TournamentRecord[]> {
    let query = supabase().from("Tournament").select("*");
    if (filter.status) query = query.eq("status", filter.status);
    if (filter.format) query = query.eq("format", filter.format);

    const { data, error } = await query
      .order("createdAt", { ascending: false })
      .limit(filter.limit ?? 50);

    const rows = optionalRows(data as DbRow[] | null, error);
    return Promise.all(rows.map(async (row) => toTournamentRecord(row, await countParticipants(String(row.id)))));
  }

  async findTournamentBySlug(slug: string): Promise<TournamentRecord | null> {
    return this.findTournament("slug", slug);
  }

  async findTournamentById(id: string): Promise<TournamentRecord | null> {
    return this.findTournament("id", id);
  }

  async createTournament(input: CreateTournamentInput): Promise<TournamentRecord> {
    const timestamp = nowIso();
    const { data, error } = await supabase()
      .from("Tournament")
      .insert(cleanForSupabase({
        id: newId(),
        slug: input.slug,
        name: input.name,
        description: input.description,
        format: input.format,
        status: "UPCOMING",
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
        discordWebhookUrl: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      }))
      .select("*")
      .single();

    return toTournamentRecord(requireRow(data as DbRow | null, error), 0);
  }

  async updateTournament(input: UpdateTournamentInput): Promise<TournamentRecord> {
    const payload: Record<string, unknown> = { updatedAt: nowIso() };
    if (input.slug !== undefined) payload.slug = input.slug;
    if (input.name !== undefined) payload.name = input.name;
    if (input.description !== undefined) payload.description = input.description;
    if (input.format !== undefined) payload.format = input.format;
    if (input.status !== undefined) payload.status = input.status;
    if (input.maxTeams !== undefined) payload.maxTeams = input.maxTeams;
    if (input.startDate !== undefined) payload.startDate = input.startDate;
    if (input.endDate !== undefined) payload.endDate = input.endDate;
    if (input.costCap !== undefined) payload.costCap = input.costCap;
    if (input.bankTime !== undefined) payload.bankTime = input.bankTime;
    if (input.fearlessDraft !== undefined) payload.fearlessDraft = input.fearlessDraft;
    if (input.patch !== undefined) payload.patch = input.patch;
    if (input.region !== undefined) payload.region = input.region;
    if (input.rulesText !== undefined) payload.rulesText = input.rulesText;
    if (input.bannerUrl !== undefined) payload.bannerUrl = input.bannerUrl;
    if (input.prizeInfo !== undefined) payload.prizeInfo = input.prizeInfo;

    const { data, error } = await supabase()
      .from("Tournament")
      .update(cleanForSupabase(payload))
      .eq("id", input.id)
      .select("*")
      .single();

    return toTournamentRecord(requireRow(data as DbRow | null, error), await countParticipants(input.id));
  }

  async updateTournamentStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase()
      .from("Tournament")
      .update(cleanForSupabase({ status, updatedAt: nowIso() }))
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async deleteTournament(id: string): Promise<void> {
    const participants = await this.listParticipants(id);
    const participantIds = participants.map((participant) => participant.id);

    if (participantIds.length > 0) {
      const { error: memberError } = await supabase()
        .from("TournamentTeamMember")
        .delete()
        .in("participantId", participantIds);
      if (memberError) throw new Error(memberError.message);
    }

    for (const table of ["TournamentMatch", "TournamentParticipant"]) {
      const { error } = await supabase().from(table).delete().eq("tournamentId", id);
      if (error) throw new Error(error.message);
    }

    const { error } = await supabase().from("Tournament").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  async listParticipants(tournamentId: string): Promise<ParticipantRecord[]> {
    const { data, error } = await supabase()
      .from("TournamentParticipant")
      .select("*")
      .eq("tournamentId", tournamentId)
      .order("seed", { ascending: true, nullsFirst: false });

    const participants = optionalRows(data as DbRow[] | null, error).map(toParticipantRecord);
    const members = await this.listMembersForParticipants(participants.map((p) => p.id));
    return participants.map((p) => ({ ...p, members: members.get(p.id) ?? [] }));
  }

  async addParticipant(input: AddParticipantInput): Promise<ParticipantRecord> {
    const participantId = newId();
    const { data, error } = await supabase()
      .from("TournamentParticipant")
      .insert(cleanForSupabase({
        id: participantId,
        tournamentId: input.tournamentId,
        playerUid: input.playerUid,
        playerNickname: input.playerNickname,
        playerAvatarUrl: input.playerAvatarUrl,
        teamName: input.teamName ?? null,
        logoUrl: input.logoUrl ?? null,
        captainUid: input.captainUid ?? input.playerUid,
        seed: input.seed,
        eliminated: false,
        joinedAt: nowIso(),
      }))
      .select("*")
      .single();

    const participant = toParticipantRecord(requireRow(data as DbRow | null, error));

    if (input.members?.length) {
      const { error: memberError } = await supabase()
        .from("TournamentTeamMember")
        .insert(input.members.map((member) => cleanForSupabase({
          id: newId(),
          participantId,
          uid: member.uid,
          nickname: member.nickname,
          avatarUrl: member.avatarUrl,
          arLevel: member.arLevel,
          role: member.role,
          joinedAt: nowIso(),
        })));

      if (memberError) throw new Error(memberError.message);
    }

    const members = await this.listMembersForParticipants([participantId]);
    return { ...participant, members: members.get(participantId) ?? [] };
  }

  async removeParticipant(tournamentId: string, playerUid: string): Promise<void> {
    const { data, error } = await supabase()
      .from("TournamentParticipant")
      .select("id")
      .eq("tournamentId", tournamentId)
      .eq("playerUid", playerUid);
    const participants = optionalRows(data as DbRow[] | null, error);
    const ids = participants.map((row) => String(row.id));

    if (ids.length > 0) {
      const { error: memberError } = await supabase()
        .from("TournamentTeamMember")
        .delete()
        .in("participantId", ids);
      if (memberError) throw new Error(memberError.message);
    }

    const { error: deleteError } = await supabase()
      .from("TournamentParticipant")
      .delete()
      .eq("tournamentId", tournamentId)
      .eq("playerUid", playerUid);
    if (deleteError) throw new Error(deleteError.message);
  }

  async listMatches(tournamentId: string): Promise<MatchRecord[]> {
    const { data, error } = await supabase()
      .from("TournamentMatch")
      .select("*")
      .eq("tournamentId", tournamentId)
      .order("round", { ascending: true })
      .order("matchNumber", { ascending: true });

    return optionalRows(data as DbRow[] | null, error).map(toMatchRecord);
  }

  async findMatchById(matchId: string): Promise<MatchRecord | null> {
    const { data, error } = await supabase()
      .from("TournamentMatch")
      .select("*")
      .eq("id", matchId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? toMatchRecord(data as DbRow) : null;
  }

  async createMatches(inputs: CreateMatchInput[]): Promise<MatchRecord[]> {
    if (inputs.length === 0) return [];
    const timestamp = nowIso();
    const { data, error } = await supabase()
      .from("TournamentMatch")
      .insert(inputs.map((input) => cleanForSupabase({
        id: newId(),
        tournamentId: input.tournamentId,
        round: input.round,
        matchNumber: input.matchNumber,
        blueParticipantId: input.blueParticipantId,
        redParticipantId: input.redParticipantId,
        winnerParticipantId: input.winnerParticipantId,
        roomCode: null,
        seriesId: null,
        seriesFormat: null,
        scheduledAt: null,
        completedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      })))
      .select("*");

    return optionalRows(data as DbRow[] | null, error).map(toMatchRecord);
  }

  async updateMatch(input: UpdateMatchInput): Promise<MatchRecord> {
    const data: Record<string, unknown> = { updatedAt: nowIso() };
    if (input.blueParticipantId !== undefined) data.blueParticipantId = input.blueParticipantId;
    if (input.redParticipantId !== undefined) data.redParticipantId = input.redParticipantId;
    if (input.winnerParticipantId !== undefined) data.winnerParticipantId = input.winnerParticipantId;
    if (input.roomCode !== undefined) data.roomCode = input.roomCode;
    if (input.seriesId !== undefined) data.seriesId = input.seriesId;
    if (input.seriesFormat !== undefined) data.seriesFormat = input.seriesFormat;
    if (input.completedAt !== undefined) data.completedAt = input.completedAt;

    const { data: row, error } = await supabase()
      .from("TournamentMatch")
      .update(cleanForSupabase(data))
      .eq("id", input.matchId)
      .select("*")
      .single();

    return toMatchRecord(requireRow(row as DbRow | null, error));
  }

  async deleteMatchesByTournament(tournamentId: string): Promise<void> {
    const { error } = await supabase()
      .from("TournamentMatch")
      .delete()
      .eq("tournamentId", tournamentId);
    if (error) throw new Error(error.message);
  }

  private async findTournament(column: "id" | "slug", value: string): Promise<TournamentRecord | null> {
    const { data, error } = await supabase()
      .from("Tournament")
      .select("*")
      .eq(column, value)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    return toTournamentRecord(data as DbRow, await countParticipants(String((data as DbRow).id)));
  }

  private async listMembersForParticipants(participantIds: string[]) {
    const grouped = new Map<string, ParticipantRecord["members"]>();
    if (participantIds.length === 0) return grouped;

    const { data, error } = await supabase()
      .from("TournamentTeamMember")
      .select("*")
      .in("participantId", participantIds)
      .order("role", { ascending: true })
      .order("joinedAt", { ascending: true });

    for (const row of optionalRows(data as DbRow[] | null, error)) {
      const participantId = String(row.participantId);
      const list = grouped.get(participantId) ?? [];
      list.push({
        id: String(row.id),
        participantId,
        uid: String(row.uid),
        nickname: String(row.nickname),
        avatarUrl: row.avatarUrl == null ? null : String(row.avatarUrl),
        arLevel: row.arLevel == null ? null : Number(row.arLevel),
        role: String(row.role ?? "PLAYER"),
        joinedAt: toDate(row.joinedAt),
      });
      grouped.set(participantId, list);
    }

    return grouped;
  }
}

async function countParticipants(tournamentId: string): Promise<number> {
  const { count, error } = await supabase()
    .from("TournamentParticipant")
    .select("*", { count: "exact", head: true })
    .eq("tournamentId", tournamentId);
  return optionalCount(count, error);
}

function toTournamentRecord(row: DbRow, participantCount: number): TournamentRecord {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: row.description == null ? null : String(row.description),
    format: String(row.format) as TournamentRecord["format"],
    status: String(row.status ?? "UPCOMING") as TournamentStatus,
    maxTeams: Number(row.maxTeams ?? 8),
    startDate: toNullableDate(row.startDate),
    endDate: toNullableDate(row.endDate),
    costCap: Number(row.costCap ?? 36),
    bankTime: Number(row.bankTime ?? 120),
    fearlessDraft: Boolean(row.fearlessDraft ?? false),
    patch: row.patch == null ? null : String(row.patch),
    region: row.region == null ? null : String(row.region),
    rulesText: row.rulesText == null ? null : String(row.rulesText),
    organizerId: row.organizerId == null ? null : String(row.organizerId),
    organizerName: row.organizerName == null ? null : String(row.organizerName),
    bannerUrl: row.bannerUrl == null ? null : String(row.bannerUrl),
    prizeInfo: row.prizeInfo == null ? null : String(row.prizeInfo),
    participantCount,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function toParticipantRecord(row: DbRow): ParticipantRecord {
  return {
    id: String(row.id),
    tournamentId: String(row.tournamentId),
    playerUid: String(row.playerUid),
    playerNickname: String(row.playerNickname),
    playerAvatarUrl: row.playerAvatarUrl == null ? null : String(row.playerAvatarUrl),
    teamName: row.teamName == null ? null : String(row.teamName),
    logoUrl: row.logoUrl == null ? null : String(row.logoUrl),
    captainUid: row.captainUid == null ? null : String(row.captainUid),
    seed: row.seed == null ? null : Number(row.seed),
    eliminated: Boolean(row.eliminated ?? false),
    joinedAt: toDate(row.joinedAt),
    members: [],
  };
}

function toMatchRecord(row: DbRow): MatchRecord {
  return {
    id: String(row.id),
    tournamentId: String(row.tournamentId),
    round: Number(row.round),
    matchNumber: Number(row.matchNumber),
    blueParticipantId: row.blueParticipantId == null ? null : String(row.blueParticipantId),
    redParticipantId: row.redParticipantId == null ? null : String(row.redParticipantId),
    winnerParticipantId: row.winnerParticipantId == null ? null : String(row.winnerParticipantId),
    roomCode: row.roomCode == null ? null : String(row.roomCode),
    seriesId: row.seriesId == null ? null : String(row.seriesId),
    seriesFormat: row.seriesFormat == null ? null : String(row.seriesFormat),
    scheduledAt: toNullableDate(row.scheduledAt),
    completedAt: toNullableDate(row.completedAt),
  };
}
