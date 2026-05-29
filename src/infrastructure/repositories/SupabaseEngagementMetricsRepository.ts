import type { CostCatalogRepository } from "@/application/ports/CostCatalogRepository";
import type {
  EngagementMetricsRepository,
  LifetimeMetrics,
  WindowMetrics,
} from "@/application/ports/EngagementMetricsRepository";
import {
  calculateBuildCost,
  getWeaponIdFromSnapshot,
  type CostCatalog,
} from "@/domain/cost/CostCatalog";
import {
  optionalCount,
  optionalRows,
  supabase,
  toDate,
  type DbRow,
} from "@/infrastructure/repositories/SupabaseRepositoryUtils";

type RoomLite = {
  id: string;
  blueUid: string | null;
  redUid: string | null;
  createdAt: Date;
  builds: Array<{
    player: string;
    characterId: string;
    rarity: number;
    consLevel: number;
    weaponRarity: number;
    enkaSnapshot: unknown;
    createdAt: Date;
  }>;
  logs: Array<{ player: string; action: string; characterId: string }>;
};

type CountQuery = ReturnType<ReturnType<ReturnType<typeof supabase>["from"]>["select"]>;

export class SupabaseEngagementMetricsRepository implements EngagementMetricsRepository {
  constructor(private readonly costCatalogRepository: CostCatalogRepository) {}

  async getLifetime(uid: string): Promise<LifetimeMetrics> {
    const [rooms, costCatalog, friends, joined, finalsWon] = await Promise.all([
      this.fetchRooms(uid),
      this.costCatalogRepository.read(),
      this.countFriends(uid),
      this.countRows("TournamentParticipant", (query) => query.eq("playerUid", uid)),
      this.countTournamentsWon(uid),
    ]);

    let wins = 0;
    let losses = 0;
    let draws = 0;
    let buildsSubmitted = 0;
    const opponents = new Set<string>();
    const characters = new Set<string>();

    for (const room of rooms) {
      const isBlue = room.blueUid === uid;
      const blueCost = sumCost(room, "BLUE", costCatalog);
      const redCost = sumCost(room, "RED", costCatalog);
      const selfCost = isBlue ? blueCost : redCost;
      const oppCost = isBlue ? redCost : blueCost;
      if (selfCost === oppCost) draws++;
      else if (selfCost > oppCost) wins++;
      else losses++;

      const opp = isBlue ? room.redUid : room.blueUid;
      if (opp) opponents.add(opp);

      const ownSide = isBlue ? "BLUE" : "RED";
      for (const log of room.logs) {
        if (log.action === "PICK" && log.player === ownSide) {
          characters.add(log.characterId);
        }
      }
      for (const build of room.builds) {
        if (build.player === ownSide) buildsSubmitted++;
      }
    }

    return {
      totalMatches: rooms.length,
      totalWins: wins,
      totalLosses: losses,
      totalDraws: draws,
      uniqueOpponents: opponents.size,
      uniqueCharactersPicked: characters.size,
      buildsSubmitted,
      tournamentsJoined: joined,
      tournamentsWon: finalsWon,
      friendsCount: friends,
    };
  }

  async getWindow(uid: string, since: Date): Promise<WindowMetrics> {
    const [rooms, costCatalog, joined, friendsAdded, activityEvents] = await Promise.all([
      this.fetchRooms(uid, since),
      this.costCatalogRepository.read(),
      this.countRows("TournamentParticipant", (query) => query.eq("playerUid", uid).gte("joinedAt", since.toISOString())),
      this.countAcceptedFriendsSince(uid, since),
      this.countRows("ActivityEvent", (query) => query.eq("actorUid", uid).gte("createdAt", since.toISOString())),
    ]);

    let matchesWon = 0;
    let buildsSubmitted = 0;
    for (const room of rooms) {
      const isBlue = room.blueUid === uid;
      const blueCost = sumCost(room, "BLUE", costCatalog);
      const redCost = sumCost(room, "RED", costCatalog);
      const selfCost = isBlue ? blueCost : redCost;
      const oppCost = isBlue ? redCost : blueCost;
      if (selfCost > oppCost) matchesWon++;

      const ownSide = isBlue ? "BLUE" : "RED";
      for (const build of room.builds) {
        if (build.player === ownSide && build.createdAt >= since) buildsSubmitted++;
      }
    }

    return {
      matchesPlayed: rooms.length,
      matchesWon,
      buildsSubmitted,
      tournamentsJoined: joined,
      friendsAdded,
      activityEvents,
    };
  }

  private async fetchRooms(uid: string, since?: Date): Promise<RoomLite[]> {
    let query = supabase()
      .from("Room")
      .select("id,blueUid,redUid,createdAt")
      .eq("status", "FINISHED")
      .or(`blueUid.eq.${uid},redUid.eq.${uid}`);

    if (since) query = query.gte("createdAt", since.toISOString());

    const { data, error } = await query.range(0, 9999);
    const roomRows = optionalRows(data as DbRow[] | null, error);
    const ids = roomRows.map((row) => String(row.id));
    const [builds, logs] = await Promise.all([
      fetchBuilds(ids),
      fetchLogs(ids),
    ]);

    return roomRows.map((row) => ({
      id: String(row.id),
      blueUid: row.blueUid == null ? null : String(row.blueUid),
      redUid: row.redUid == null ? null : String(row.redUid),
      createdAt: toDate(row.createdAt),
      builds: builds.get(String(row.id)) ?? [],
      logs: logs.get(String(row.id)) ?? [],
    }));
  }

  private async countRows(
    table: string,
    apply: (query: CountQuery) => CountQuery,
  ): Promise<number> {
    const query = apply(supabase().from(table).select("*", { count: "exact", head: true }));
    const { count, error } = await query;
    return optionalCount(count, error);
  }

  private async countFriends(uid: string): Promise<number> {
    return this.countRows("Friendship", (query) =>
      query
        .eq("status", "ACCEPTED")
        .or(`requesterUid.eq.${uid},addresseeUid.eq.${uid}`),
    );
  }

  private async countAcceptedFriendsSince(uid: string, since: Date): Promise<number> {
    return this.countRows("Friendship", (query) =>
      query
        .eq("status", "ACCEPTED")
        .gte("updatedAt", since.toISOString())
        .or(`requesterUid.eq.${uid},addresseeUid.eq.${uid}`),
    );
  }

  private async countTournamentsWon(uid: string): Promise<number> {
    const { data, error } = await supabase()
      .from("TournamentParticipant")
      .select("id,tournamentId")
      .eq("playerUid", uid)
      .range(0, 9999);

    const participations = optionalRows(data as DbRow[] | null, error);
    if (participations.length === 0) return 0;

    let count = 0;
    for (const participation of participations) {
      const { data: finalMatch, error: matchError } = await supabase()
        .from("TournamentMatch")
        .select("winnerParticipantId")
        .eq("tournamentId", String(participation.tournamentId))
        .order("round", { ascending: false })
        .order("matchNumber", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (matchError) throw new Error(matchError.message);
      if (finalMatch && String((finalMatch as DbRow).winnerParticipantId) === String(participation.id)) {
        count++;
      }
    }
    return count;
  }
}

async function fetchBuilds(roomIds: string[]) {
  const grouped = new Map<string, RoomLite["builds"]>();
  if (roomIds.length === 0) return grouped;

  const { data, error } = await supabase()
    .from("CharacterBuild")
    .select("roomId,player,characterId,rarity,consLevel,weaponRarity,enkaSnapshot,createdAt")
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
      createdAt: toDate(row.createdAt),
    });
    grouped.set(roomId, list);
  }
  return grouped;
}

async function fetchLogs(roomIds: string[]) {
  const grouped = new Map<string, RoomLite["logs"]>();
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

function sumCost(room: RoomLite, side: "BLUE" | "RED", costCatalog: CostCatalog): number {
  return room.builds
    .filter((b) => b.player === side)
    .reduce(
      (sum, b) =>
        sum +
        calculateBuildCost(costCatalog, {
          characterId: b.characterId,
          characterRarity: b.rarity,
          consLevel: b.consLevel,
          weaponId: getWeaponIdFromSnapshot(b.enkaSnapshot),
          weaponRarity: b.weaponRarity,
        }).totalCost,
      0,
    );
}
