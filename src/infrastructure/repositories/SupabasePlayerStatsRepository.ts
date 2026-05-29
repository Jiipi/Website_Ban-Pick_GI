import type { CostCatalogRepository } from "@/application/ports/CostCatalogRepository";
import type {
  PlayerMatchRecord,
  PlayerProfileRecord,
  PlayerStatsRecord,
  PlayerStatsRepository,
} from "@/application/ports/PlayerStatsRepository";
import {
  calculateBuildCost,
  getWeaponIdFromSnapshot,
  getWeaponRefinementFromSnapshot,
  type CostCatalog,
} from "@/domain/cost/CostCatalog";
import {
  optionalRows,
  supabase,
  toDate,
  type DbRow,
} from "@/infrastructure/repositories/SupabaseRepositoryUtils";

type RoomWithBuildsLite = {
  code: string;
  status: string;
  costPerPoint: number;
  blueUid: string | null;
  redUid: string | null;
  bluePlayerName: string | null;
  redPlayerName: string | null;
  blueNickname: string | null;
  redNickname: string | null;
  blueAvatarUrl: string | null;
  redAvatarUrl: string | null;
  createdAt: Date;
  builds: Array<{
    player: string;
    characterId: string;
    rarity: number;
    consLevel: number;
    weaponRarity: number;
    enkaSnapshot: unknown;
  }>;
  logs: Array<{
    player: string;
    action: string;
    characterId: string;
  }>;
};

export class SupabasePlayerStatsRepository implements PlayerStatsRepository {
  constructor(private readonly costCatalogRepository: CostCatalogRepository) {}

  async listLeaderboard(limit: number): Promise<PlayerStatsRecord[]> {
    const rooms = await this.fetchFinishedRoomsWithUid();
    const costCatalog = await this.costCatalogRepository.read();
    const map = new Map<string, PlayerStatsRecord>();

    for (const room of rooms) {
      const blueCost = sumCostFor(room, "BLUE", costCatalog);
      const redCost = sumCostFor(room, "RED", costCatalog);

      if (room.blueUid) {
        upsertPlayer(map, {
          uid: room.blueUid,
          nickname: room.blueNickname ?? room.bluePlayerName ?? room.blueUid,
          avatarUrl: room.blueAvatarUrl,
        });
        applyResult(map.get(room.blueUid)!, blueCost, redCost);
      }

      if (room.redUid) {
        upsertPlayer(map, {
          uid: room.redUid,
          nickname: room.redNickname ?? room.redPlayerName ?? room.redUid,
          avatarUrl: room.redAvatarUrl,
        });
        applyResult(map.get(room.redUid)!, redCost, blueCost);
      }
    }

    return Array.from(map.values())
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        const aRate = a.totalMatches > 0 ? a.wins / a.totalMatches : 0;
        const bRate = b.totalMatches > 0 ? b.wins / b.totalMatches : 0;
        if (bRate !== aRate) return bRate - aRate;
        return b.totalMatches - a.totalMatches;
      })
      .slice(0, limit);
  }

  async findPlayerProfileByUid(uid: string): Promise<PlayerProfileRecord | null> {
    const { data, error } = await supabase()
      .from("LobbyPlayer")
      .select("*")
      .eq("uid", uid)
      .order("updatedAt", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    const row = data as DbRow;
    return {
      uid: String(row.uid),
      nickname: String(row.nickname),
      avatarUrl: row.avatarUrl == null ? null : String(row.avatarUrl),
      displayName: row.displayName == null ? null : String(row.displayName),
      customAvatarUrl: row.customAvatarUrl == null ? null : String(row.customAvatarUrl),
    };
  }

  async findPlayerStatsByUid(uid: string): Promise<PlayerStatsRecord | null> {
    const rooms = await this.fetchFinishedRoomsWithUid(uid);
    if (rooms.length === 0) return null;
    const costCatalog = await this.costCatalogRepository.read();

    let nickname = uid;
    let avatarUrl: string | null = null;
    let wins = 0;
    let losses = 0;
    let draws = 0;

    for (const room of rooms) {
      const blueCost = sumCostFor(room, "BLUE", costCatalog);
      const redCost = sumCostFor(room, "RED", costCatalog);
      const isBlue = room.blueUid === uid;
      const selfCost = isBlue ? blueCost : redCost;
      const oppCost = isBlue ? redCost : blueCost;

      if (isBlue) {
        nickname = room.blueNickname ?? room.bluePlayerName ?? nickname;
        avatarUrl = room.blueAvatarUrl ?? avatarUrl;
      } else {
        nickname = room.redNickname ?? room.redPlayerName ?? nickname;
        avatarUrl = room.redAvatarUrl ?? avatarUrl;
      }

      const result = computeResult(selfCost, oppCost);
      if (result === "WIN") wins++;
      else if (result === "LOSS") losses++;
      else draws++;
    }

    return { uid, nickname, avatarUrl, totalMatches: rooms.length, wins, losses, draws };
  }

  async listPlayerMatches(uid: string, limit: number): Promise<PlayerMatchRecord[]> {
    const rooms = await this.fetchFinishedRoomsWithUid(uid, limit);
    const costCatalog = await this.costCatalogRepository.read();

    return rooms.map((room) => {
      const isBlue = room.blueUid === uid;
      const side: "BLUE" | "RED" = isBlue ? "BLUE" : "RED";
      const blueCost = sumCostFor(room, "BLUE", costCatalog);
      const redCost = sumCostFor(room, "RED", costCatalog);
      const selfCost = isBlue ? blueCost : redCost;
      const opponentCost = isBlue ? redCost : blueCost;
      const opponentName = isBlue
        ? room.redNickname ?? room.redPlayerName
        : room.blueNickname ?? room.bluePlayerName;
      const opponentUid = isBlue ? room.redUid : room.blueUid;
      const result = computeResult(selfCost, opponentCost);
      const picks = room.logs.filter((l) => l.player === side && l.action === "PICK").map((l) => l.characterId);
      const bans = room.logs.filter((l) => l.player === side && l.action === "BAN").map((l) => l.characterId);

      return {
        roomCode: room.code,
        side,
        selfCost,
        opponentCost,
        opponentName,
        opponentUid,
        result,
        picks,
        bans,
        date: room.createdAt,
        status: room.status,
      };
    });
  }

  private async fetchFinishedRoomsWithUid(uid?: string, limit = 200): Promise<RoomWithBuildsLite[]> {
    let query = supabase()
      .from("Room")
      .select("id,code,status,costPerPoint,blueUid,redUid,bluePlayerName,redPlayerName,blueNickname,redNickname,blueAvatarUrl,redAvatarUrl,createdAt")
      .eq("status", "FINISHED");

    query = uid
      ? query.or(`blueUid.eq.${uid},redUid.eq.${uid}`)
      : query.or("blueUid.not.is.null,redUid.not.is.null");

    const { data, error } = await query
      .order("createdAt", { ascending: false })
      .limit(limit);

    const rooms = optionalRows(data as DbRow[] | null, error);
    const ids = rooms.map((row) => String(row.id));
    const [builds, logs] = await Promise.all([fetchBuilds(ids), fetchLogs(ids)]);

    return rooms.map((row) => ({
      code: String(row.code),
      status: String(row.status),
      costPerPoint: Number(row.costPerPoint ?? 10),
      blueUid: row.blueUid == null ? null : String(row.blueUid),
      redUid: row.redUid == null ? null : String(row.redUid),
      bluePlayerName: row.bluePlayerName == null ? null : String(row.bluePlayerName),
      redPlayerName: row.redPlayerName == null ? null : String(row.redPlayerName),
      blueNickname: row.blueNickname == null ? null : String(row.blueNickname),
      redNickname: row.redNickname == null ? null : String(row.redNickname),
      blueAvatarUrl: row.blueAvatarUrl == null ? null : String(row.blueAvatarUrl),
      redAvatarUrl: row.redAvatarUrl == null ? null : String(row.redAvatarUrl),
      createdAt: toDate(row.createdAt),
      builds: builds.get(String(row.id)) ?? [],
      logs: logs.get(String(row.id)) ?? [],
    }));
  }
}

async function fetchBuilds(roomIds: string[]) {
  const grouped = new Map<string, RoomWithBuildsLite["builds"]>();
  if (roomIds.length === 0) return grouped;

  const { data, error } = await supabase()
    .from("CharacterBuild")
    .select("roomId,player,characterId,rarity,consLevel,weaponRarity,enkaSnapshot")
    .in("roomId", roomIds)
    .range(0, 9999);

  for (const row of optionalRows(data as DbRow[] | null, error)) {
    const roomId = String(row.roomId);
    const list = grouped.get(roomId) ?? [];
    list.push({
      player: String(row.player),
      characterId: String(row.characterId),
      rarity: Number(row.rarity),
      consLevel: Number(row.consLevel),
      weaponRarity: Number(row.weaponRarity),
      enkaSnapshot: row.enkaSnapshot ?? null,
    });
    grouped.set(roomId, list);
  }
  return grouped;
}

async function fetchLogs(roomIds: string[]) {
  const grouped = new Map<string, RoomWithBuildsLite["logs"]>();
  if (roomIds.length === 0) return grouped;

  const { data, error } = await supabase()
    .from("DraftLog")
    .select("roomId,player,action,characterId")
    .in("roomId", roomIds)
    .range(0, 9999);

  for (const row of optionalRows(data as DbRow[] | null, error)) {
    const roomId = String(row.roomId);
    const list = grouped.get(roomId) ?? [];
    list.push({
      player: String(row.player),
      action: String(row.action),
      characterId: String(row.characterId),
    });
    grouped.set(roomId, list);
  }
  return grouped;
}

function sumCostFor(room: RoomWithBuildsLite, side: "BLUE" | "RED", costCatalog: CostCatalog): number {
  return room.builds
    .filter((b) => b.player === side)
    .reduce((sum, b) => sum + calculateBuildCost(costCatalog, {
      characterId: b.characterId,
      characterRarity: b.rarity,
      consLevel: b.consLevel,
      weaponId: getWeaponIdFromSnapshot(b.enkaSnapshot),
      weaponRarity: b.weaponRarity,
      weaponRefinement: getWeaponRefinementFromSnapshot(b.enkaSnapshot),
    }).totalCost, 0);
}

function computeResult(selfCost: number, opponentCost: number): "WIN" | "LOSS" | "DRAW" {
  if (selfCost === opponentCost) return "DRAW";
  return selfCost > opponentCost ? "WIN" : "LOSS";
}

function upsertPlayer(
  map: Map<string, PlayerStatsRecord>,
  data: { uid: string; nickname: string; avatarUrl: string | null },
) {
  const existing = map.get(data.uid);
  if (existing) {
    if (data.avatarUrl) existing.avatarUrl = data.avatarUrl;
    existing.nickname = data.nickname;
    return;
  }
  map.set(data.uid, {
    uid: data.uid,
    nickname: data.nickname,
    avatarUrl: data.avatarUrl,
    totalMatches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
  });
}

function applyResult(player: PlayerStatsRecord, selfCost: number, oppCost: number) {
  player.totalMatches++;
  const result = computeResult(selfCost, oppCost);
  if (result === "WIN") player.wins++;
  else if (result === "LOSS") player.losses++;
  else player.draws++;
}
