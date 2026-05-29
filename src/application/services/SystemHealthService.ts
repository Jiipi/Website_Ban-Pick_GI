import type {
  HealthComponent,
  SystemHealth,
  SystemHealthRepository,
} from "@/application/ports/SystemHealthRepository";
import { success } from "@/application/shared/ServiceResult";

const STARTUP_AT = Date.now();

export class SystemHealthService {
  constructor(private readonly repo: SystemHealthRepository) {}

  async getHealth() {
    const components: HealthComponent[] = [];

    // DB
    const dbStart = Date.now();
    try {
      const ping = await this.repo.pingDatabase();
      components.push({
        id: "database",
        name: "Supabase Database",
        status: ping.ok ? "operational" : "outage",
        message: ping.message,
        latencyMs: ping.latencyMs,
      });
    } catch (error) {
      components.push({
        id: "database",
        name: "Supabase Database",
        status: "outage",
        message: error instanceof Error ? error.message : "DB error",
        latencyMs: Date.now() - dbStart,
      });
    }

    // Supabase Auth
    components.push({
      id: "supabase-auth",
      name: "Supabase Auth",
      status: process.env.NEXT_PUBLIC_SUPABASE_URL ? "operational" : "degraded",
      message: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Configured" : "Missing env vars",
      latencyMs: null,
    });

    // External: Enka
    components.push({
      id: "enka-network",
      name: "Enka.Network API",
      status: "operational",
      message: "Public read-only — không kiểm tra realtime",
      latencyMs: null,
    });

    // External: Genshin DB
    components.push({
      id: "genshin-data",
      name: "Genshin DB API",
      status: "operational",
      message: "Public read-only — không kiểm tra realtime",
      latencyMs: null,
    });

    // Realtime broadcast
    components.push({
      id: "realtime",
      name: "Realtime Broadcasts",
      status: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "operational" : "degraded",
      message: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "Supabase channels configured"
        : "Missing anon key",
      latencyMs: null,
    });

    // Metrics
    let metrics = { totalRooms: 0, activeRooms: 0, totalTournaments: 0, onlinePlayers: 0, totalUsers: 0 };
    try {
      const [rooms, tournaments, onlinePlayers, users] = await Promise.all([
        this.repo.countRooms(),
        this.repo.countTournaments(),
        this.repo.countOnlinePlayers(),
        this.repo.countUsers(),
      ]);
      metrics = {
        totalRooms: rooms.total,
        activeRooms: rooms.active,
        totalTournaments: tournaments,
        onlinePlayers,
        totalUsers: users,
      };
    } catch {
      // metrics stay at 0 if DB is down
    }

    // Compute overall status
    const hasOutage = components.some((c) => c.status === "outage");
    const hasDegraded = components.some((c) => c.status === "degraded");
    const overall = hasOutage ? "outage" : hasDegraded ? "degraded" : "operational";

    const health: SystemHealth = {
      overall,
      uptimeSeconds: Math.floor((Date.now() - STARTUP_AT) / 1000),
      components,
      metrics,
      timestamp: new Date().toISOString(),
    };

    return success(health);
  }
}
