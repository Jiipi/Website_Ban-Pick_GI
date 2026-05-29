import type { SystemHealthRepository } from "@/application/ports/SystemHealthRepository";
import {
  optionalCount,
  supabase,
} from "@/infrastructure/repositories/SupabaseRepositoryUtils";

export class SupabaseSystemHealthRepository implements SystemHealthRepository {
  async pingDatabase(): Promise<{ ok: boolean; latencyMs: number; message: string }> {
    const start = Date.now();
    try {
      const { error } = await supabase()
        .from("Room")
        .select("id", { count: "exact", head: true })
        .limit(1);

      if (error) throw new Error(error.message);
      return { ok: true, latencyMs: Date.now() - start, message: "Connected" };
    } catch (error) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        message: error instanceof Error ? error.message : "Supabase database unreachable",
      };
    }
  }

  async countRooms(): Promise<{ total: number; active: number }> {
    const [total, active] = await Promise.all([
      countTable("Room"),
      countActiveRooms(),
    ]);
    return { total, active };
  }

  async countTournaments(): Promise<number> {
    return countTable("Tournament");
  }

  async countOnlinePlayers(): Promise<number> {
    const { count, error } = await supabase()
      .from("LobbyPlayer")
      .select("*", { count: "exact", head: true })
      .eq("status", "ONLINE");
    return optionalCount(count, error);
  }

  async countUsers(): Promise<number> {
    return countTable("User");
  }
}

async function countTable(table: string): Promise<number> {
  const { count, error } = await supabase()
    .from(table)
    .select("*", { count: "exact", head: true });
  return optionalCount(count, error);
}

async function countActiveRooms(): Promise<number> {
  const { count, error } = await supabase()
    .from("Room")
    .select("*", { count: "exact", head: true })
    .in("status", ["WAITING", "DRAFTING", "BUILDING"]);
  return optionalCount(count, error);
}
