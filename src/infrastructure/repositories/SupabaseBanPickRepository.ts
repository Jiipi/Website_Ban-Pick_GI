import type {
  BanPickRepository,
  BuildUpsertData,
  CharacterBuildRecord,
  ChatMessageRecord,
  DraftLogRecord,
  DraftPageRoomRecord,
  LobbyPlayerRecord,
  LobbyPlayerUpdateData,
  RoomCreateData,
  RoomRecord,
  RoomSnapshotRecord,
  RoomUpdateData,
  RoomWithBuilds,
  RoomWithLogs,
  RoomWithLogsAndBuilds,
  UserRecord,
} from "@/application/ports/BanPickRepository";
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
  toStringArray,
  type DbRow,
} from "@/infrastructure/repositories/SupabaseRepositoryUtils";

const DEFAULT_BANK_TIME = 120;

export class SupabaseBanPickRepository implements BanPickRepository {
  async withTransaction<T>(work: (tx: BanPickRepository) => Promise<T>): Promise<T> {
    return work(this);
  }

  async upsertUser(input: { id: string; email: string; name?: string | null; role?: string }): Promise<UserRecord> {
    const existing = await this.findUserById(input.id);
    const timestamp = nowIso();

    if (existing) {
      const updateData: Record<string, unknown> = {
        email: input.email,
        updatedAt: timestamp,
      };
      if ("name" in input) updateData.name = input.name ?? null;
      if (input.role) updateData.role = input.role;

      const { data, error } = await supabase()
        .from("User")
        .update(cleanForSupabase(updateData))
        .eq("id", input.id)
        .select("*")
        .single();

      return toUserRecord(requireRow(data as DbRow | null, error));
    }

    const { data, error } = await supabase()
      .from("User")
      .insert(cleanForSupabase({
        id: input.id,
        email: input.email,
        name: input.name ?? null,
        role: input.role ?? "PLAYER",
        createdAt: timestamp,
        updatedAt: timestamp,
      }))
      .select("*")
      .single();

    return toUserRecord(requireRow(data as DbRow | null, error));
  }

  async listUsers(): Promise<UserRecord[]> {
    const { data, error } = await supabase()
      .from("User")
      .select("*")
      .order("createdAt", { ascending: false });

    return optionalRows(data as DbRow[] | null, error).map(toUserRecord);
  }

  async createRoom(data: RoomCreateData): Promise<RoomRecord> {
    const timestamp = nowIso();
    const { data: row, error } = await supabase()
      .from("Room")
      .insert(cleanForSupabase({
        id: newId(),
        code: data.code,
        status: data.status ?? "WAITING",
        costPerPoint: data.costPerPoint,
        blueBankTime: data.blueBankTime ?? DEFAULT_BANK_TIME,
        redBankTime: data.redBankTime ?? DEFAULT_BANK_TIME,
        lastTurnStartedAt: data.lastTurnStartedAt ?? null,
        constraints: data.constraints ?? null,
        draftTemplate: data.draftTemplate ?? null,
        isPaused: data.isPaused ?? false,
        pausedAt: data.pausedAt ?? null,
        pauseReason: data.pauseReason ?? null,
        seriesId: data.seriesId ?? null,
        seriesFormat: data.seriesFormat ?? null,
        gameNumber: data.gameNumber ?? null,
        fearlessDraft: data.fearlessDraft ?? false,
        blueTeamName: data.blueTeamName ?? null,
        blueTeamLogo: data.blueTeamLogo ?? null,
        blueTeamColor: data.blueTeamColor ?? null,
        redTeamName: data.redTeamName ?? null,
        redTeamLogo: data.redTeamLogo ?? null,
        redTeamColor: data.redTeamColor ?? null,
        casterClientIds: data.casterClientIds ?? [],
        spectatorDelay: data.spectatorDelay ?? 0,
        discordWebhookUrl: data.discordWebhookUrl ?? null,
        isPublic: data.isPublic ?? true,
        hostUserId: data.hostUserId ?? null,
        hostName: data.hostName ?? null,
        hostClientId: data.hostClientId ?? null,
        bluePlayerName: data.bluePlayerName ?? null,
        blueClientId: data.blueClientId ?? null,
        blueUid: data.blueUid ?? null,
        blueNickname: data.blueNickname ?? null,
        blueAvatarUrl: data.blueAvatarUrl ?? null,
        redPlayerName: data.redPlayerName ?? null,
        redClientId: data.redClientId ?? null,
        redUid: data.redUid ?? null,
        redNickname: data.redNickname ?? null,
        redAvatarUrl: data.redAvatarUrl ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
      }))
      .select("*")
      .single();

    return toRoomRecord(requireRow(row as DbRow | null, error));
  }

  async findRoomById(id: string): Promise<RoomRecord | null> {
    const { data, error } = await supabase()
      .from("Room")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? toRoomRecord(data as DbRow) : null;
  }

  async findRoomByCode(code: string): Promise<RoomRecord | null> {
    return this.findRoom("code", code);
  }

  async findWaitingRoomByHost(userId: string, clientId: string): Promise<RoomRecord | null> {
    const { data, error } = await supabase()
      .from("Room")
      .select("*")
      .eq("status", "WAITING")
      .eq("hostUserId", userId)
      .eq("hostClientId", clientId)
      .order("updatedAt", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? toRoomRecord(data as DbRow) : null;
  }

  async findRoomWithLogsByCode(code: string): Promise<RoomWithLogs | null> {
    const room = await this.findRoomByCode(code);
    if (!room) return null;
    const logs = await this.findDraftLogs(room.id);
    return { ...room, logs };
  }

  async findRoomWithLogsAndBuildsByCode(code: string): Promise<RoomWithLogsAndBuilds | null> {
    const room = await this.findRoomByCode(code);
    if (!room) return null;
    const [logs, builds] = await Promise.all([
      this.findDraftLogs(room.id),
      this.findCharacterBuilds(room.id),
    ]);
    return { ...room, logs, builds };
  }

  async findRoomWithBuildsByCode(code: string): Promise<RoomWithBuilds | null> {
    const room = await this.findRoomByCode(code);
    if (!room) return null;
    const builds = await this.findCharacterBuilds(room.id);
    return { ...room, builds };
  }

  async findRoomSnapshotByCode(code: string): Promise<RoomSnapshotRecord | null> {
    const room = await this.findRoomByCode(code);
    if (!room) return null;
    const [logs, builds, messages] = await Promise.all([
      this.findDraftLogs(room.id),
      this.findCharacterBuilds(room.id),
      this.findChatMessages(room.id, 100),
    ]);
    return { ...room, logs, builds, messages };
  }

  async findDraftPageRoomByCode(code: string): Promise<DraftPageRoomRecord | null> {
    const room = await this.findRoomByCode(code);
    if (!room) return null;
    const [logs, builds] = await Promise.all([
      this.findDraftLogs(room.id),
      this.countCharacterBuilds(room.id),
    ]);
    return { ...room, logs, _count: { builds } };
  }

  async listRecentRoomsWithLogsAndBuilds(limit: number): Promise<RoomWithLogsAndBuilds[]> {
    const { data, error } = await supabase()
      .from("Room")
      .select("*")
      .order("createdAt", { ascending: false })
      .limit(limit);

    const rooms = optionalRows(data as DbRow[] | null, error).map(toRoomRecord);
    const ids = rooms.map((room) => room.id);
    if (ids.length === 0) return [];

    const [logs, builds] = await Promise.all([
      this.findDraftLogsForRooms(ids),
      this.findCharacterBuildsForRooms(ids),
    ]);

    return rooms.map((room) => ({
      ...room,
      logs: logs.get(room.id) ?? [],
      builds: builds.get(room.id) ?? [],
    }));
  }

  async updateRoom(id: string, data: RoomUpdateData): Promise<RoomRecord> {
    const { data: row, error } = await supabase()
      .from("Room")
      .update(cleanForSupabase({ ...data, updatedAt: nowIso() }))
      .eq("id", id)
      .select("*")
      .single();

    return toRoomRecord(requireRow(row as DbRow | null, error));
  }

  async deleteRoomById(id: string): Promise<void> {
    for (const table of ["DraftLog", "CharacterBuild", "ChatMessage"]) {
      const { error } = await supabase().from(table).delete().eq("roomId", id);
      if (error) throw new Error(error.message);
    }
    const { error } = await supabase().from("Room").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }

  async findRoomsBySeriesId(seriesId: string): Promise<RoomRecord[]> {
    const { data, error } = await supabase()
      .from("Room")
      .select("*")
      .eq("seriesId", seriesId)
      .order("gameNumber", { ascending: true });

    return optionalRows(data as DbRow[] | null, error).map(toRoomRecord);
  }

  async findDraftLogs(roomId: string): Promise<DraftLogRecord[]> {
    const { data, error } = await supabase()
      .from("DraftLog")
      .select("*")
      .eq("roomId", roomId)
      .order("turnNumber", { ascending: true })
      .order("id", { ascending: true });

    return optionalRows(data as DbRow[] | null, error).map(toDraftLogRecord);
  }

  async createDraftLog(data: {
    roomId: string;
    player: string;
    action: string;
    characterId: string;
    turnNumber: number;
  }): Promise<DraftLogRecord> {
    const { data: row, error } = await supabase()
      .from("DraftLog")
      .insert(cleanForSupabase({ ...data, createdAt: nowIso() }))
      .select("*")
      .single();

    return toDraftLogRecord(requireRow(row as DbRow | null, error));
  }

  async deleteDraftLogs(roomId: string): Promise<void> {
    const { error } = await supabase().from("DraftLog").delete().eq("roomId", roomId);
    if (error) throw new Error(error.message);
  }

  async deleteDraftLogByTurnNumber(roomId: string, turnNumber: number): Promise<void> {
    const { error } = await supabase()
      .from("DraftLog")
      .delete()
      .eq("roomId", roomId)
      .eq("turnNumber", turnNumber);
    if (error) throw new Error(error.message);
  }

  async upsertCharacterBuild(data: BuildUpsertData): Promise<CharacterBuildRecord> {
    const existing = await this.findCharacterBuild(data.roomId, data.player, data.characterId);
    const payload = cleanForSupabase({
      roomId: data.roomId,
      player: data.player,
      characterId: data.characterId,
      rarity: data.rarity,
      consLevel: data.consLevel,
      weaponRarity: data.weaponRarity,
      totalCost: data.totalCost,
      source: "MANUAL",
      enkaSnapshot: data.enkaSnapshot ?? null,
      updatedAt: nowIso(),
    });

    if (existing) {
      const { data: row, error } = await supabase()
        .from("CharacterBuild")
        .update(payload)
        .eq("id", existing.id)
        .select("*")
        .single();
      return toCharacterBuildRecord(requireRow(row as DbRow | null, error));
    }

    const { data: row, error } = await supabase()
      .from("CharacterBuild")
      .insert({ ...payload, createdAt: nowIso() })
      .select("*")
      .single();

    return toCharacterBuildRecord(requireRow(row as DbRow | null, error));
  }

  async countCharacterBuilds(roomId: string): Promise<number> {
    const { count, error } = await supabase()
      .from("CharacterBuild")
      .select("*", { count: "exact", head: true })
      .eq("roomId", roomId);
    return optionalCount(count, error);
  }

  async deleteCharacterBuilds(roomId: string): Promise<void> {
    const { error } = await supabase().from("CharacterBuild").delete().eq("roomId", roomId);
    if (error) throw new Error(error.message);
  }

  async findChatMessages(roomId: string, limit: number): Promise<ChatMessageRecord[]> {
    const { data, error } = await supabase()
      .from("ChatMessage")
      .select("*")
      .eq("roomId", roomId)
      .order("createdAt", { ascending: true })
      .limit(limit);

    return optionalRows(data as DbRow[] | null, error).map(toChatMessageRecord);
  }

  async createChatMessage(data: {
    roomId: string;
    sender: string;
    message: string;
    role: string;
  }): Promise<ChatMessageRecord> {
    const { data: row, error } = await supabase()
      .from("ChatMessage")
      .insert(cleanForSupabase({ ...data, createdAt: nowIso() }))
      .select("*")
      .single();

    return toChatMessageRecord(requireRow(row as DbRow | null, error));
  }

  async upsertLobbyPlayerByClientId(data: {
    clientId: string;
    uid: string;
    nickname: string;
    avatarUrl?: string | null;
  }): Promise<LobbyPlayerRecord> {
    const existing = await this.findLobbyPlayerByClientId(data.clientId);
    const timestamp = nowIso();
    const payload = cleanForSupabase({
      clientId: data.clientId,
      uid: data.uid,
      nickname: data.nickname,
      avatarUrl: data.avatarUrl ?? null,
      status: "ONLINE",
      roomCode: null,
      team: null,
      updatedAt: timestamp,
    });

    if (existing) {
      const { data: row, error } = await supabase()
        .from("LobbyPlayer")
        .update(payload)
        .eq("clientId", data.clientId)
        .select("*")
        .single();
      return toLobbyPlayerRecord(requireRow(row as DbRow | null, error));
    }

    const { data: row, error } = await supabase()
      .from("LobbyPlayer")
      .insert({
        ...payload,
        id: newId(),
        displayName: null,
        customAvatarUrl: null,
        createdAt: timestamp,
      })
      .select("*")
      .single();
    return toLobbyPlayerRecord(requireRow(row as DbRow | null, error));
  }

  async findLobbyPlayerByClientId(clientId: string): Promise<LobbyPlayerRecord | null> {
    const { data, error } = await supabase()
      .from("LobbyPlayer")
      .select("*")
      .eq("clientId", clientId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? toLobbyPlayerRecord(data as DbRow) : null;
  }

  async findOnlineLobbyPlayerByUid(uid: string): Promise<LobbyPlayerRecord | null> {
    const { data, error } = await supabase()
      .from("LobbyPlayer")
      .select("*")
      .eq("uid", uid)
      .eq("status", "ONLINE")
      .order("updatedAt", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? toLobbyPlayerRecord(data as DbRow) : null;
  }

  async listLobbyPlayers(input: { status?: string; uid?: string | null }): Promise<LobbyPlayerRecord[]> {
    let query = supabase().from("LobbyPlayer").select("*");
    if (input.status) query = query.eq("status", input.status);
    if (input.uid) query = query.eq("uid", input.uid);

    const { data, error } = await query.order("createdAt", { ascending: false });
    return optionalRows(data as DbRow[] | null, error).map(toLobbyPlayerRecord);
  }

  async listPublicOnlineLobbyPlayers(): Promise<LobbyPlayerRecord[]> {
    const { data, error } = await supabase()
      .from("LobbyPlayer")
      .select("*")
      .eq("status", "ONLINE")
      .order("updatedAt", { ascending: false });

    return optionalRows(data as DbRow[] | null, error).map(toLobbyPlayerRecord);
  }

  async updateLobbyPlayerById(id: string, data: LobbyPlayerUpdateData): Promise<LobbyPlayerRecord> {
    const { data: row, error } = await supabase()
      .from("LobbyPlayer")
      .update(cleanForSupabase({ ...data, updatedAt: nowIso() }))
      .eq("id", id)
      .select("*")
      .single();

    return toLobbyPlayerRecord(requireRow(row as DbRow | null, error));
  }

  async updateLobbyPlayerByClientId(clientId: string, data: LobbyPlayerUpdateData): Promise<void> {
    const { error } = await supabase()
      .from("LobbyPlayer")
      .update(cleanForSupabase({ ...data, updatedAt: nowIso() }))
      .eq("clientId", clientId);
    if (error) throw new Error(error.message);
  }

  async updateLobbyPlayersByInvite(input: {
    uid: string;
    roomCode: string;
    status: string;
    data: LobbyPlayerUpdateData;
  }): Promise<void> {
    const { error } = await supabase()
      .from("LobbyPlayer")
      .update(cleanForSupabase({ ...input.data, updatedAt: nowIso() }))
      .eq("uid", input.uid)
      .eq("roomCode", input.roomCode)
      .eq("status", input.status);
    if (error) throw new Error(error.message);
  }

  private async findUserById(id: string): Promise<UserRecord | null> {
    const { data, error } = await supabase()
      .from("User")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? toUserRecord(data as DbRow) : null;
  }

  private async findRoom(column: "id" | "code", value: string): Promise<RoomRecord | null> {
    const { data, error } = await supabase()
      .from("Room")
      .select("*")
      .eq(column, value)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? toRoomRecord(data as DbRow) : null;
  }

  private async findCharacterBuild(roomId: string, player: string, characterId: string): Promise<CharacterBuildRecord | null> {
    const { data, error } = await supabase()
      .from("CharacterBuild")
      .select("*")
      .eq("roomId", roomId)
      .eq("player", player)
      .eq("characterId", characterId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? toCharacterBuildRecord(data as DbRow) : null;
  }

  private async findCharacterBuilds(roomId: string): Promise<CharacterBuildRecord[]> {
    const { data, error } = await supabase()
      .from("CharacterBuild")
      .select("*")
      .eq("roomId", roomId)
      .order("player", { ascending: true })
      .order("characterId", { ascending: true });

    return optionalRows(data as DbRow[] | null, error).map(toCharacterBuildRecord);
  }

  private async findDraftLogsForRooms(roomIds: string[]): Promise<Map<string, DraftLogRecord[]>> {
    const { data, error } = await supabase()
      .from("DraftLog")
      .select("*")
      .in("roomId", roomIds)
      .order("turnNumber", { ascending: true })
      .order("id", { ascending: true });

    return groupByRoom(optionalRows(data as DbRow[] | null, error).map(toDraftLogRecord));
  }

  private async findCharacterBuildsForRooms(roomIds: string[]): Promise<Map<string, CharacterBuildRecord[]>> {
    const { data, error } = await supabase()
      .from("CharacterBuild")
      .select("*")
      .in("roomId", roomIds)
      .order("player", { ascending: true })
      .order("characterId", { ascending: true });

    return groupByRoom(optionalRows(data as DbRow[] | null, error).map(toCharacterBuildRecord));
  }
}

function groupByRoom<T extends { roomId: string }>(rows: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const list = grouped.get(row.roomId) ?? [];
    list.push(row);
    grouped.set(row.roomId, list);
  }
  return grouped;
}

function toUserRecord(row: DbRow): UserRecord {
  return {
    id: String(row.id),
    email: String(row.email),
    name: row.name == null ? null : String(row.name),
    role: String(row.role ?? "PLAYER"),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function toRoomRecord(row: DbRow): RoomRecord {
  return {
    id: String(row.id),
    code: String(row.code),
    status: String(row.status ?? "WAITING"),
    costPerPoint: Number(row.costPerPoint ?? 10),
    blueBankTime: Number(row.blueBankTime ?? DEFAULT_BANK_TIME),
    redBankTime: Number(row.redBankTime ?? DEFAULT_BANK_TIME),
    lastTurnStartedAt: toNullableDate(row.lastTurnStartedAt),
    constraints: row.constraints ?? null,
    draftTemplate: row.draftTemplate ?? null,
    isPaused: Boolean(row.isPaused ?? false),
    pausedAt: toNullableDate(row.pausedAt),
    pauseReason: row.pauseReason == null ? null : String(row.pauseReason),
    seriesId: row.seriesId == null ? null : String(row.seriesId),
    seriesFormat: row.seriesFormat == null ? null : String(row.seriesFormat),
    gameNumber: row.gameNumber == null ? null : Number(row.gameNumber),
    fearlessDraft: Boolean(row.fearlessDraft ?? false),
    blueTeamName: row.blueTeamName == null ? null : String(row.blueTeamName),
    blueTeamLogo: row.blueTeamLogo == null ? null : String(row.blueTeamLogo),
    blueTeamColor: row.blueTeamColor == null ? null : String(row.blueTeamColor),
    redTeamName: row.redTeamName == null ? null : String(row.redTeamName),
    redTeamLogo: row.redTeamLogo == null ? null : String(row.redTeamLogo),
    redTeamColor: row.redTeamColor == null ? null : String(row.redTeamColor),
    casterClientIds: toStringArray(row.casterClientIds),
    spectatorDelay: Number(row.spectatorDelay ?? 0),
    discordWebhookUrl: row.discordWebhookUrl == null ? null : String(row.discordWebhookUrl),
    isPublic: Boolean(row.isPublic ?? true),
    hostUserId: row.hostUserId == null ? null : String(row.hostUserId),
    hostName: row.hostName == null ? null : String(row.hostName),
    hostClientId: row.hostClientId == null ? null : String(row.hostClientId),
    bluePlayerName: row.bluePlayerName == null ? null : String(row.bluePlayerName),
    blueClientId: row.blueClientId == null ? null : String(row.blueClientId),
    blueUid: row.blueUid == null ? null : String(row.blueUid),
    blueNickname: row.blueNickname == null ? null : String(row.blueNickname),
    blueAvatarUrl: row.blueAvatarUrl == null ? null : String(row.blueAvatarUrl),
    redPlayerName: row.redPlayerName == null ? null : String(row.redPlayerName),
    redClientId: row.redClientId == null ? null : String(row.redClientId),
    redUid: row.redUid == null ? null : String(row.redUid),
    redNickname: row.redNickname == null ? null : String(row.redNickname),
    redAvatarUrl: row.redAvatarUrl == null ? null : String(row.redAvatarUrl),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function toDraftLogRecord(row: DbRow): DraftLogRecord {
  return {
    id: Number(row.id),
    roomId: String(row.roomId),
    player: String(row.player),
    action: String(row.action),
    characterId: String(row.characterId),
    turnNumber: Number(row.turnNumber),
    createdAt: toDate(row.createdAt),
  };
}

function toCharacterBuildRecord(row: DbRow): CharacterBuildRecord {
  return {
    id: Number(row.id),
    roomId: String(row.roomId),
    player: String(row.player),
    characterId: String(row.characterId),
    rarity: Number(row.rarity),
    consLevel: Number(row.consLevel),
    weaponRarity: Number(row.weaponRarity),
    totalCost: Number(row.totalCost),
    source: String(row.source ?? "MANUAL"),
    enkaSnapshot: row.enkaSnapshot ?? null,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function toLobbyPlayerRecord(row: DbRow): LobbyPlayerRecord {
  return {
    id: String(row.id),
    clientId: String(row.clientId),
    uid: String(row.uid),
    nickname: String(row.nickname),
    avatarUrl: row.avatarUrl == null ? null : String(row.avatarUrl),
    displayName: row.displayName == null ? null : String(row.displayName),
    customAvatarUrl: row.customAvatarUrl == null ? null : String(row.customAvatarUrl),
    status: String(row.status ?? "ONLINE"),
    roomCode: row.roomCode == null ? null : String(row.roomCode),
    team: row.team == null ? null : String(row.team),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

function toChatMessageRecord(row: DbRow): ChatMessageRecord {
  return {
    id: Number(row.id),
    roomId: String(row.roomId),
    sender: String(row.sender),
    message: String(row.message),
    role: String(row.role ?? "HOST"),
    createdAt: toDate(row.createdAt),
  };
}
