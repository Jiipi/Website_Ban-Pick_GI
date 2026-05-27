export type ComponentStatus = "operational" | "degraded" | "outage";

export type HealthComponent = {
  id: string;
  name: string;
  status: ComponentStatus;
  message: string;
  latencyMs: number | null;
};

export type SystemHealth = {
  overall: ComponentStatus;
  uptimeSeconds: number;
  components: HealthComponent[];
  metrics: {
    totalRooms: number;
    activeRooms: number;
    totalTournaments: number;
    onlinePlayers: number;
    totalUsers: number;
  };
  timestamp: string;
};

export interface SystemHealthRepository {
  pingDatabase(): Promise<{ ok: boolean; latencyMs: number; message: string }>;
  countRooms(): Promise<{ total: number; active: number }>;
  countTournaments(): Promise<number>;
  countOnlinePlayers(): Promise<number>;
  countUsers(): Promise<number>;
}
