import { create } from "zustand";
import type { CostCatalog } from "@/domain/cost/CostCatalog";
import type { DraftEntry } from "@/lib/draft";
import type { Session } from "@/lib/types";

type DraftClientState = {
  // Selection
  selected: string[];
  toggleSelected: (id: string, maxQuantity: number) => void;
  clearSelected: () => void;

  // Remote preview (from other players via broadcast)
  previewSelections: { player: string; characterIds: string[] } | null;
  setPreviewSelections: (preview: { player: string; characterIds: string[] } | null) => void;
  clearPreviewSelections: () => void;

  // Feedback
  error: string;
  setError: (msg: string) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;

  // UI panels
  chatOpen: boolean;
  toggleChat: () => void;
  setChatOpen: (v: boolean) => void;
  hostPanelOpen: boolean;
  toggleHostPanel: () => void;
  setHostPanelOpen: (v: boolean) => void;

  // Optimistic draft logs
  optimisticLogs: DraftEntry[];
  addOptimisticLogs: (entries: DraftEntry[]) => void;
  removeOptimisticLogs: (entries: DraftEntry[]) => void;
  clearOptimisticLogs: () => void;

  // Client session
  session: Session | null;
  setSession: (s: Session | null) => void;

  // ── Realtime data from client-side fetch ──
  realtimeLogs: DraftEntry[] | null;
  setRealtimeLogs: (logs: DraftEntry[]) => void;
  mergeLogEntry: (entry: DraftEntry) => void;
  realtimeStatus: string | null;
  setRealtimeStatus: (s: string) => void;
  realtimeRoom: RealtimeRoomData | null;
  setRealtimeRoom: (r: RealtimeRoomData) => void;
  realtimeBuildCount: number | null;
  setRealtimeBuildCount: (n: number) => void;
  realtimeBuilds: RealtimeBuildData[] | null;
  setRealtimeBuilds: (builds: RealtimeBuildData[]) => void;
  mergeBuildEntry: (build: RealtimeBuildData) => void;
  removeBuildEntry: (player: string, characterId: string) => void;
  realtimeCostCatalog: CostCatalog | null;
  setRealtimeCostCatalog: (catalog: CostCatalog) => void;

  // ── Remote fetch function (set by RealtimeRefresh) ──
  fetchRoomData: (() => Promise<void>) | null;
  setFetchRoomData: (fn: (() => Promise<void>) | null) => void;

  // ── Ready check (pre-draft) ──
  blueReady: boolean;
  redReady: boolean;
  setBlueReady: (v: boolean) => void;
  setRedReady: (v: boolean) => void;
  resetReady: () => void;

  // ── Reveal queue ──
  revealQueue: Array<{
    characterId: string;
    characterName: string;
    characterIconUrl: string;
    action: string;
    team: string;
  }>;
  addReveal: (reveal: {
    characterId: string;
    characterName: string;
    characterIconUrl: string;
    action: string;
    team: string;
  }) => void;
  popReveal: () => void;
  clearReveals: () => void;
};

export type RealtimeRoomData = {
  hostClientId: string | null;
  blueClientId: string | null;
  redClientId: string | null;
  bluePlayerName: string | null;
  redPlayerName: string | null;
  blueUid: string | null;
  redUid: string | null;
  blueNickname: string | null;
  redNickname: string | null;
  blueAvatarUrl: string | null;
  redAvatarUrl: string | null;
  hostName: string | null;
  status: string;
  updatedAt: string | null;
  blueBankTime: number;
  redBankTime: number;
  lastTurnStartedAt: string | null;
  isPaused: boolean;
  pausedAt: string | null;
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
  draftTemplate: unknown;
};

export type RealtimeBuildData = {
  player: string;
  characterId: string;
  rarity: number;
  consLevel: number;
  weaponRarity: number;
  totalCost: number;
  source?: string;
  enkaSnapshot?: unknown;
};

export const useDraftStore = create<DraftClientState>((set, get) => ({
  // Selection
  selected: [],
  toggleSelected: (id, maxQuantity) =>
    set((state) => {
      if (state.selected.includes(id)) {
        return { selected: state.selected.filter((s) => s !== id) };
      }
      if (state.selected.length >= maxQuantity) {
        return { selected: [...state.selected.slice(1), id] };
      }
      return { selected: [...state.selected, id] };
    }),
  clearSelected: () => set({ selected: [] }),

  // Remote preview
  previewSelections: null,
  setPreviewSelections: (preview) => set({ previewSelections: preview }),
  clearPreviewSelections: () => set({ previewSelections: null }),

  // Feedback
  error: "",
  setError: (msg) => set({ error: msg }),
  loading: false,
  setLoading: (v) => set({ loading: v }),

  // UI panels
  chatOpen: false,
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  setChatOpen: (v) => set({ chatOpen: v }),
  hostPanelOpen: false,
  toggleHostPanel: () => set((s) => ({ hostPanelOpen: !s.hostPanelOpen })),
  setHostPanelOpen: (v) => set({ hostPanelOpen: v }),

  // Optimistic logs
  optimisticLogs: [],
  addOptimisticLogs: (entries) =>
    set((s) => ({ optimisticLogs: [...s.optimisticLogs, ...entries] })),
  removeOptimisticLogs: (entries) =>
    set((s) => ({ optimisticLogs: s.optimisticLogs.filter((e) => !entries.includes(e)) })),
  clearOptimisticLogs: () => set({ optimisticLogs: [] }),

  // Session
  session: null,
  setSession: (s) => set({ session: s }),

  // Realtime data
  realtimeLogs: null,
  setRealtimeLogs: (logs) => set({ realtimeLogs: logs, optimisticLogs: [] }),

  // Merge a single new log entry from realtime event (instant, no fetch needed)
  mergeLogEntry: (entry) => set((s) => {
    const base = s.realtimeLogs ?? [];
    // Don't add duplicate
    if (base.some((l) => l.turnNumber === entry.turnNumber && l.characterId === entry.characterId)) {
      return {};
    }
    // Remove from optimistic if it matches
    const newOptimistic = s.optimisticLogs.filter(
      (o) => o.characterId !== entry.characterId || o.turnNumber !== entry.turnNumber,
    );
    return {
      realtimeLogs: [...base, entry],
      optimisticLogs: newOptimistic,
    };
  }),

  realtimeStatus: null,
  setRealtimeStatus: (s) => set({ realtimeStatus: s }),
  realtimeRoom: null,
  setRealtimeRoom: (r) => set({ realtimeRoom: r }),
  realtimeBuildCount: null,
  setRealtimeBuildCount: (n) => set({ realtimeBuildCount: n }),
  realtimeBuilds: null,
  setRealtimeBuilds: (builds) => set({ realtimeBuilds: builds, realtimeBuildCount: builds.length }),
  mergeBuildEntry: (build) => set((s) => {
    const base = s.realtimeBuilds ?? [];
    const next = base.filter((item) => item.player !== build.player || item.characterId !== build.characterId);
    const merged = [...next, build];
    return { realtimeBuilds: merged, realtimeBuildCount: merged.length };
  }),
  removeBuildEntry: (player, characterId) => set((s) => {
    const merged = (s.realtimeBuilds ?? []).filter((item) => item.player !== player || item.characterId !== characterId);
    return { realtimeBuilds: merged, realtimeBuildCount: merged.length };
  }),
  realtimeCostCatalog: null,
  setRealtimeCostCatalog: (catalog) => set({ realtimeCostCatalog: catalog }),

  // Fetch function (registered by RealtimeRefresh)
  fetchRoomData: null,
  setFetchRoomData: (fn) => set({ fetchRoomData: fn }),

  revealQueue: [],
  addReveal: (reveal) =>
    set((s) => ({ revealQueue: [...s.revealQueue, reveal] })),
  popReveal: () =>
    set((s) => ({ revealQueue: s.revealQueue.slice(1) })),
  clearReveals: () => set({ revealQueue: [] }),

  // ── Ready check ──
  blueReady: false,
  redReady: false,
  setBlueReady: (v) => set({ blueReady: v }),
  setRedReady: (v) => set({ redReady: v }),
  resetReady: () => set({ blueReady: false, redReady: false }),
}));
