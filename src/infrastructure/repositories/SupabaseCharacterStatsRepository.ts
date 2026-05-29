import type {
  CharacterStatsRecord,
  CharacterStatsRepository,
  PairedCharacterRecord,
  RecentMatchRecord,
} from "@/application/ports/CharacterStatsRepository";
import {
  optionalCount,
  optionalRows,
  supabase,
  toDate,
  type DbRow,
} from "@/infrastructure/repositories/SupabaseRepositoryUtils";

export class SupabaseCharacterStatsRepository implements CharacterStatsRepository {
  async countPicksByCharacter(characterId: string): Promise<number> {
    return countLogs({ characterId, action: "PICK" });
  }

  async countBansByCharacter(characterId: string): Promise<number> {
    return countLogs({ characterId, action: "BAN" });
  }

  async countFinishedRooms(): Promise<number> {
    const { count, error } = await supabase()
      .from("Room")
      .select("*", { count: "exact", head: true })
      .eq("status", "FINISHED");
    return optionalCount(count, error);
  }

  async listRecentLogsForCharacter(characterId: string, limit: number): Promise<RecentMatchRecord[]> {
    const { data, error } = await supabase()
      .from("DraftLog")
      .select("*")
      .eq("characterId", characterId)
      .order("createdAt", { ascending: false })
      .limit(limit);

    const logs = optionalRows(data as DbRow[] | null, error);
    const roomIds = Array.from(new Set(logs.map((row) => String(row.roomId))));
    const rooms = await fetchRoomsById(roomIds);

    return logs.flatMap((log) => {
      const room = rooms.get(String(log.roomId));
      if (!room) return [];
      return [{
        roomCode: String(room.code),
        action: String(log.action),
        player: String(log.player),
        bluePlayerName: room.bluePlayerName == null ? null : String(room.bluePlayerName),
        redPlayerName: room.redPlayerName == null ? null : String(room.redPlayerName),
        date: toDate(room.createdAt),
      }];
    });
  }

  async findPairedCharacters(characterId: string, limit: number): Promise<PairedCharacterRecord[]> {
    const { data, error } = await supabase()
      .from("DraftLog")
      .select("roomId,player")
      .eq("characterId", characterId)
      .eq("action", "PICK")
      .range(0, 9999);

    const anchorRows = optionalRows(data as DbRow[] | null, error);
    const roomIds = Array.from(new Set(anchorRows.map((row) => String(row.roomId))));
    if (roomIds.length === 0) return [];

    const anchors = new Set(anchorRows.map((row) => `${String(row.roomId)}:${String(row.player)}`));
    const { data: pickRows, error: pickError } = await supabase()
      .from("DraftLog")
      .select("roomId,player,characterId")
      .in("roomId", roomIds)
      .eq("action", "PICK")
      .range(0, 9999);

    const counts = new Map<string, number>();
    for (const row of optionalRows(pickRows as DbRow[] | null, pickError)) {
      const pairedId = String(row.characterId);
      if (pairedId === characterId) continue;
      if (!anchors.has(`${String(row.roomId)}:${String(row.player)}`)) continue;
      counts.set(pairedId, (counts.get(pairedId) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([id, count]) => ({ characterId: id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  async aggregatePicksByCharacter(): Promise<CharacterStatsRecord[]> {
    return aggregateLogs("PICK", "pickCount");
  }

  async aggregateBansByCharacter(): Promise<CharacterStatsRecord[]> {
    return aggregateLogs("BAN", "banCount");
  }
}

async function countLogs(filter: { characterId: string; action: string }): Promise<number> {
  const { count, error } = await supabase()
    .from("DraftLog")
    .select("*", { count: "exact", head: true })
    .eq("characterId", filter.characterId)
    .eq("action", filter.action);
  return optionalCount(count, error);
}

async function aggregateLogs(action: "PICK" | "BAN", field: "pickCount" | "banCount"): Promise<CharacterStatsRecord[]> {
  const { data, error } = await supabase()
    .from("DraftLog")
    .select("characterId")
    .eq("action", action)
    .range(0, 9999);

  const counts = new Map<string, number>();
  for (const row of optionalRows(data as DbRow[] | null, error)) {
    const characterId = String(row.characterId);
    counts.set(characterId, (counts.get(characterId) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([characterId, count]) => ({
    characterId,
    pickCount: field === "pickCount" ? count : 0,
    banCount: field === "banCount" ? count : 0,
  }));
}

async function fetchRoomsById(roomIds: string[]): Promise<Map<string, DbRow>> {
  const rooms = new Map<string, DbRow>();
  if (roomIds.length === 0) return rooms;

  const { data, error } = await supabase()
    .from("Room")
    .select("id,code,bluePlayerName,redPlayerName,createdAt")
    .in("id", roomIds);

  for (const row of optionalRows(data as DbRow[] | null, error)) {
    rooms.set(String(row.id), row);
  }
  return rooms;
}
