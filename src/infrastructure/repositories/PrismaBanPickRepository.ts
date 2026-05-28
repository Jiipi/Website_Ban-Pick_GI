import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  BanPickRepository,
  BuildUpsertData,
  ChatMessageRecord,
  CharacterBuildRecord,
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

type PrismaLike = PrismaClient | Prisma.TransactionClient;

export class PrismaBanPickRepository implements BanPickRepository {
  constructor(private readonly client: PrismaLike = prisma) {}

  async withTransaction<T>(work: (tx: BanPickRepository) => Promise<T>): Promise<T> {
    if (!("$transaction" in this.client)) {
      return work(this);
    }
    return this.client.$transaction((tx) => work(new PrismaBanPickRepository(tx)));
  }

  async upsertUser(input: { id: string; email: string; name?: string | null; role?: string }): Promise<UserRecord> {
    const createData: Prisma.UserCreateInput = {
      id: input.id,
      email: input.email,
      name: input.name ?? null,
      ...(input.role ? { role: input.role } : {}),
    };
    const updateData: Prisma.UserUpdateInput = { email: input.email };
    if ("name" in input) updateData.name = input.name ?? null;
    if (input.role) updateData.role = input.role;

    return this.client.user.upsert({
      where: { id: input.id },
      create: createData,
      update: updateData,
    });
  }

  async listUsers(): Promise<UserRecord[]> {
    return this.client.user.findMany({ orderBy: { createdAt: "desc" } });
  }

  async createRoom(data: RoomCreateData): Promise<RoomRecord> {
    return this.client.room.create({
      data: {
        code: data.code,
        costPerPoint: data.costPerPoint,
        hostUserId: data.hostUserId ?? undefined,
        hostName: data.hostName ?? undefined,
        hostClientId: data.hostClientId ?? undefined,
        // Series fields
        seriesId: data.seriesId ?? undefined,
        seriesFormat: data.seriesFormat ?? undefined,
        gameNumber: data.gameNumber ?? undefined,
        fearlessDraft: data.fearlessDraft ?? undefined,
        // Template & constraints
        draftTemplate: data.draftTemplate ?? undefined,
        constraints: data.constraints ?? undefined,
        // Player slots (for series: new room inherits swapped slots)
        blueClientId: data.blueClientId ?? undefined,
        bluePlayerName: data.bluePlayerName ?? undefined,
        blueUid: data.blueUid ?? undefined,
        blueNickname: data.blueNickname ?? undefined,
        blueAvatarUrl: data.blueAvatarUrl ?? undefined,
        redClientId: data.redClientId ?? undefined,
        redPlayerName: data.redPlayerName ?? undefined,
        redUid: data.redUid ?? undefined,
        redNickname: data.redNickname ?? undefined,
        redAvatarUrl: data.redAvatarUrl ?? undefined,
      },
    });
  }

  async findRoomById(id: string): Promise<RoomRecord | null> {
    return this.client.room.findUnique({ where: { id } });
  }

  async findRoomByCode(code: string): Promise<RoomRecord | null> {
    return this.client.room.findUnique({ where: { code } });
  }

  async findWaitingRoomByHost(userId: string, clientId: string): Promise<RoomRecord | null> {
    return this.client.room.findFirst({
      where: {
        status: "WAITING",
        hostUserId: userId,
        hostClientId: clientId,
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findRoomWithLogsByCode(code: string): Promise<RoomWithLogs | null> {
    return this.client.room.findUnique({
      where: { code },
      include: { logs: { orderBy: [{ turnNumber: "asc" }, { id: "asc" }] } },
    });
  }

  async findRoomWithLogsAndBuildsByCode(code: string): Promise<RoomWithLogsAndBuilds | null> {
    return this.client.room.findUnique({
      where: { code },
      include: {
        logs: { orderBy: [{ turnNumber: "asc" }, { id: "asc" }] },
        builds: true,
      },
    });
  }

  async findRoomWithBuildsByCode(code: string): Promise<RoomWithBuilds | null> {
    return this.client.room.findUnique({
      where: { code },
      include: { builds: { orderBy: [{ player: "asc" }, { characterId: "asc" }] } },
    });
  }

  async findRoomSnapshotByCode(code: string): Promise<RoomSnapshotRecord | null> {
    return this.client.room.findUnique({
      where: { code },
      include: {
        logs: { orderBy: [{ turnNumber: "asc" }, { id: "asc" }] },
        builds: { orderBy: [{ player: "asc" }, { characterId: "asc" }] },
        messages: { orderBy: { createdAt: "asc" }, take: 100 },
      },
    });
  }

  async findDraftPageRoomByCode(code: string): Promise<DraftPageRoomRecord | null> {
    return this.client.room.findUnique({
      where: { code },
      include: {
        logs: { orderBy: [{ turnNumber: "asc" }, { id: "asc" }] },
        _count: { select: { builds: true } },
      },
    });
  }

  async listRecentRoomsWithLogsAndBuilds(limit: number): Promise<RoomWithLogsAndBuilds[]> {
    return this.client.room.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        logs: { orderBy: { turnNumber: "asc" } },
        builds: true,
      },
    });
  }

  async updateRoom(id: string, data: RoomUpdateData): Promise<RoomRecord> {
    return this.client.room.update({ where: { id }, data });
  }

  async deleteRoomById(id: string): Promise<void> {
    await this.client.room.delete({ where: { id } });
  }

  async findRoomsBySeriesId(seriesId: string): Promise<RoomRecord[]> {
    return this.client.room.findMany({
      where: { seriesId },
      orderBy: { gameNumber: "asc" },
    });
  }

  async findDraftLogs(roomId: string): Promise<DraftLogRecord[]> {
    return this.client.draftLog.findMany({
      where: { roomId },
      orderBy: [{ turnNumber: "asc" }, { id: "asc" }],
    });
  }

  async createDraftLog(data: {
    roomId: string;
    player: string;
    action: string;
    characterId: string;
    turnNumber: number;
  }): Promise<DraftLogRecord> {
    return this.client.draftLog.create({ data });
  }

  async deleteDraftLogs(roomId: string): Promise<void> {
    await this.client.draftLog.deleteMany({ where: { roomId } });
  }

  async deleteDraftLogByTurnNumber(roomId: string, turnNumber: number): Promise<void> {
    await this.client.draftLog.deleteMany({ where: { roomId, turnNumber } });
  }

  async upsertCharacterBuild(data: BuildUpsertData): Promise<CharacterBuildRecord> {
    const enkaSnapshot = data.enkaSnapshot === undefined ? Prisma.JsonNull : data.enkaSnapshot as Prisma.InputJsonValue;

    return this.client.characterBuild.upsert({
      where: {
        roomId_player_characterId: {
          roomId: data.roomId,
          player: data.player,
          characterId: data.characterId,
        },
      },
      create: {
        ...data,
        enkaSnapshot,
      },
      update: {
        rarity: data.rarity,
        consLevel: data.consLevel,
        weaponRarity: data.weaponRarity,
        totalCost: data.totalCost,
        enkaSnapshot,
      },
    });
  }

  async countCharacterBuilds(roomId: string): Promise<number> {
    return this.client.characterBuild.count({ where: { roomId } });
  }

  async deleteCharacterBuilds(roomId: string): Promise<void> {
    await this.client.characterBuild.deleteMany({ where: { roomId } });
  }

  async findChatMessages(roomId: string, limit: number): Promise<ChatMessageRecord[]> {
    return this.client.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  }

  async createChatMessage(data: {
    roomId: string;
    sender: string;
    message: string;
    role: string;
  }): Promise<ChatMessageRecord> {
    return this.client.chatMessage.create({ data });
  }

  async upsertLobbyPlayerByClientId(data: {
    clientId: string;
    uid: string;
    nickname: string;
    avatarUrl?: string | null;
  }): Promise<LobbyPlayerRecord> {
    return this.client.lobbyPlayer.upsert({
      where: { clientId: data.clientId },
      update: {
        uid: data.uid,
        nickname: data.nickname,
        avatarUrl: data.avatarUrl ?? null,
        status: "ONLINE",
        roomCode: null,
        team: null,
      },
      create: {
        clientId: data.clientId,
        uid: data.uid,
        nickname: data.nickname,
        avatarUrl: data.avatarUrl ?? null,
      },
    });
  }

  async findLobbyPlayerByClientId(clientId: string): Promise<LobbyPlayerRecord | null> {
    return this.client.lobbyPlayer.findUnique({ where: { clientId } });
  }

  async findOnlineLobbyPlayerByUid(uid: string): Promise<LobbyPlayerRecord | null> {
    return this.client.lobbyPlayer.findFirst({ where: { uid, status: "ONLINE" } });
  }

  async listLobbyPlayers(input: { status?: string; uid?: string | null }): Promise<LobbyPlayerRecord[]> {
    return this.client.lobbyPlayer.findMany({
      where: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.uid ? { uid: input.uid } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async listPublicOnlineLobbyPlayers(): Promise<LobbyPlayerRecord[]> {
    return this.client.lobbyPlayer.findMany({
      where: { status: "ONLINE" },
      orderBy: { updatedAt: "desc" },
    });
  }

  async updateLobbyPlayerById(id: string, data: LobbyPlayerUpdateData): Promise<LobbyPlayerRecord> {
    return this.client.lobbyPlayer.update({ where: { id }, data });
  }

  async updateLobbyPlayerByClientId(clientId: string, data: LobbyPlayerUpdateData): Promise<void> {
    await this.client.lobbyPlayer.updateMany({ where: { clientId }, data });
  }

  async updateLobbyPlayersByInvite(input: {
    uid: string;
    roomCode: string;
    status: string;
    data: LobbyPlayerUpdateData;
  }): Promise<void> {
    await this.client.lobbyPlayer.updateMany({
      where: { uid: input.uid, roomCode: input.roomCode, status: input.status },
      data: input.data,
    });
  }
}
