export type UserRecord = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

export type RoomRecord = {
  id: string;
  code: string;
  status: string;
  costPerPoint: number;
  blueBankTime: number;
  redBankTime: number;
  lastTurnStartedAt: Date | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constraints: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  draftTemplate: any;
  isPaused: boolean;
  pausedAt: Date | null;
  pauseReason: string | null;
  seriesId: string | null;
  seriesFormat: string | null;
  gameNumber: number | null;
  fearlessDraft: boolean;
  blueTeamName: string | null;
  blueTeamLogo: string | null;
  blueTeamColor: string | null;
  redTeamName: string | null;
  redTeamLogo: string | null;
  redTeamColor: string | null;
  casterClientIds: string[];
  spectatorDelay: number;
  discordWebhookUrl: string | null;
  isPublic: boolean;
  hostUserId: string | null;
  hostName: string | null;
  hostClientId: string | null;
  bluePlayerName: string | null;
  blueClientId: string | null;
  blueUid: string | null;
  blueNickname: string | null;
  blueAvatarUrl: string | null;
  redPlayerName: string | null;
  redClientId: string | null;
  redUid: string | null;
  redNickname: string | null;
  redAvatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DraftLogRecord = {
  id: number;
  roomId: string;
  player: string;
  action: string;
  characterId: string;
  turnNumber: number;
  createdAt: Date;
};

export type CharacterBuildRecord = {
  id: number;
  roomId: string;
  player: string;
  characterId: string;
  rarity: number;
  consLevel: number;
  weaponRarity: number;
  totalCost: number;
  source: string;
  enkaSnapshot: unknown;
  createdAt: Date;
  updatedAt: Date;
};

export type LobbyPlayerRecord = {
  id: string;
  clientId: string;
  uid: string;
  nickname: string;
  avatarUrl: string | null;
  displayName: string | null;
  customAvatarUrl: string | null;
  status: string;
  roomCode: string | null;
  team: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ChatMessageRecord = {
  id: number;
  roomId: string;
  sender: string;
  message: string;
  role: string;
  createdAt: Date;
};

export type RoomWithLogs = RoomRecord & { logs: DraftLogRecord[] };
export type RoomWithBuilds = RoomRecord & { builds: CharacterBuildRecord[] };
export type RoomWithLogsAndBuilds = RoomRecord & {
  logs: DraftLogRecord[];
  builds: CharacterBuildRecord[];
};
export type RoomSnapshotRecord = RoomRecord & {
  logs: DraftLogRecord[];
  builds: CharacterBuildRecord[];
  messages: ChatMessageRecord[];
};
export type DraftPageRoomRecord = RoomRecord & {
  logs: DraftLogRecord[];
  _count: { builds: number };
};

export type RoomCreateData = Partial<RoomRecord> & {
  code: string;
  costPerPoint: number;
  hostUserId?: string | null;
  hostName?: string | null;
  hostClientId?: string | null;
};

export type RoomUpdateData = Partial<Omit<RoomRecord, "id" | "createdAt" | "updatedAt">>;
export type LobbyPlayerUpdateData = Partial<Omit<LobbyPlayerRecord, "id" | "createdAt" | "updatedAt">>;

export type BuildUpsertData = {
  roomId: string;
  player: string;
  characterId: string;
  rarity: number;
  consLevel: number;
  weaponRarity: number;
  totalCost: number;
  enkaSnapshot?: unknown;
};

export interface BanPickRepository {
  withTransaction<T>(work: (tx: BanPickRepository) => Promise<T>): Promise<T>;

  upsertUser(input: { id: string; email: string; name?: string | null; role?: string }): Promise<UserRecord>;
  listUsers(): Promise<UserRecord[]>;

  createRoom(data: RoomCreateData): Promise<RoomRecord>;
  findRoomById(id: string): Promise<RoomRecord | null>;
  findRoomByCode(code: string): Promise<RoomRecord | null>;
  findWaitingRoomByHost(userId: string, clientId: string): Promise<RoomRecord | null>;
  findRoomWithLogsByCode(code: string): Promise<RoomWithLogs | null>;
  findRoomWithLogsAndBuildsByCode(code: string): Promise<RoomWithLogsAndBuilds | null>;
  findRoomWithBuildsByCode(code: string): Promise<RoomWithBuilds | null>;
  findRoomSnapshotByCode(code: string): Promise<RoomSnapshotRecord | null>;
  findDraftPageRoomByCode(code: string): Promise<DraftPageRoomRecord | null>;
  listRecentRoomsWithLogsAndBuilds(limit: number): Promise<RoomWithLogsAndBuilds[]>;
  updateRoom(id: string, data: RoomUpdateData): Promise<RoomRecord>;
  deleteRoomById(id: string): Promise<void>;
  findRoomsBySeriesId(seriesId: string): Promise<RoomRecord[]>;

  findDraftLogs(roomId: string): Promise<DraftLogRecord[]>;
  createDraftLog(data: {
    roomId: string;
    player: string;
    action: string;
    characterId: string;
    turnNumber: number;
  }): Promise<DraftLogRecord>;
  deleteDraftLogs(roomId: string): Promise<void>;
  deleteDraftLogByTurnNumber(roomId: string, turnNumber: number): Promise<void>;

  upsertCharacterBuild(data: BuildUpsertData): Promise<CharacterBuildRecord>;
  countCharacterBuilds(roomId: string): Promise<number>;
  deleteCharacterBuilds(roomId: string): Promise<void>;

  findChatMessages(roomId: string, limit: number): Promise<ChatMessageRecord[]>;
  createChatMessage(data: {
    roomId: string;
    sender: string;
    message: string;
    role: string;
  }): Promise<ChatMessageRecord>;

  upsertLobbyPlayerByClientId(data: {
    clientId: string;
    uid: string;
    nickname: string;
    avatarUrl?: string | null;
  }): Promise<LobbyPlayerRecord>;
  findLobbyPlayerByClientId(clientId: string): Promise<LobbyPlayerRecord | null>;
  findOnlineLobbyPlayerByUid(uid: string): Promise<LobbyPlayerRecord | null>;
  listLobbyPlayers(input: { status?: string; uid?: string | null }): Promise<LobbyPlayerRecord[]>;
  listPublicOnlineLobbyPlayers(): Promise<LobbyPlayerRecord[]>;
  updateLobbyPlayerById(id: string, data: LobbyPlayerUpdateData): Promise<LobbyPlayerRecord>;
  updateLobbyPlayerByClientId(clientId: string, data: LobbyPlayerUpdateData): Promise<void>;
  updateLobbyPlayersByInvite(input: {
    uid: string;
    roomCode: string;
    status: string;
    data: LobbyPlayerUpdateData;
  }): Promise<void>;
}
