"use client";

import { useEffect, useRef, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useDraftStore } from "@/stores/draftStore";
import { getOrCreateClientId } from "@/lib/auth";
import { syncWithServer } from "@/lib/timeSync";

// ── Cross-tab instant sync via BroadcastChannel ──
const CHANNEL_NAME = "banpick-realtime";

// Singleton Supabase client for broadcast (shared across components)
type BrowserSupabaseClient = NonNullable<ReturnType<typeof createSupabaseBrowserClient>>;

let _broadcastSupabase: BrowserSupabaseClient | null | undefined;
function getBroadcastSupabase() {
  if (_broadcastSupabase === undefined) {
    _broadcastSupabase = createSupabaseBrowserClient();
  }
  return _broadcastSupabase;
}

// Active broadcast channel reference
let _previewChannel: ReturnType<BrowserSupabaseClient["channel"]> | null = null;
let _previewRoomId: string | null = null;

type Props = {
  roomId: string;
  roomCode: string;
};

export function RealtimeRefresh({ roomId, roomCode }: Props) {
  const setRealtimeLogs = useDraftStore((s) => s.setRealtimeLogs);
  const setRealtimeStatus = useDraftStore((s) => s.setRealtimeStatus);
  const setRealtimeRoom = useDraftStore((s) => s.setRealtimeRoom);
  const setRealtimeBuildCount = useDraftStore((s) => s.setRealtimeBuildCount);
  const setRealtimeBuilds = useDraftStore((s) => s.setRealtimeBuilds);
  const setRealtimeCostCatalog = useDraftStore((s) => s.setRealtimeCostCatalog);
  const mergeLogEntry = useDraftStore((s) => s.mergeLogEntry);
  const setFetchRoomData = useDraftStore((s) => s.setFetchRoomData);
  const fetchingRef = useRef(false);
  const bcRef = useRef<BroadcastChannel | null>(null);

  const fetchRoomData = useCallback(async () => {
    // Deduplicate concurrent fetches
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const clientId = getOrCreateClientId();
      const res = await fetch(`/api/room/${roomCode}?clientId=${encodeURIComponent(clientId)}`, {
        cache: "no-store",
      });
      if (!res.ok) return;

      const data = await res.json();
      const room = data.room;

      if (data.serverTime) {
        syncWithServer(data.serverTime);
      }

      if (room.logs) {
        setRealtimeLogs(room.logs);
      }
      setRealtimeStatus(room.status);
      setRealtimeRoom({
        hostClientId: room.hostClientId,
        blueClientId: room.blueClientId,
        redClientId: room.redClientId,
        bluePlayerName: room.bluePlayerName,
        redPlayerName: room.redPlayerName,
        blueUid: room.blueUid,
        redUid: room.redUid,
        blueNickname: room.blueNickname,
        redNickname: room.redNickname,
        blueAvatarUrl: room.blueAvatarUrl || null,
        redAvatarUrl: room.redAvatarUrl || null,
        hostName: room.hostName,
        status: room.status,
        updatedAt: room.updatedAt || null,
        blueBankTime: room.blueBankTime ?? 120,
        redBankTime: room.redBankTime ?? 120,
        lastTurnStartedAt: room.lastTurnStartedAt || null,
        isPaused: room.isPaused ?? false,
        pausedAt: room.pausedAt || null,
        pauseReason: room.pauseReason || null,
        seriesId: room.seriesId || null,
        seriesFormat: room.seriesFormat || null,
        gameNumber: room.gameNumber ?? null,
        fearlessDraft: room.fearlessDraft ?? false,
        blueTeamName: room.blueTeamName || null,
        blueTeamLogo: room.blueTeamLogo || null,
        blueTeamColor: room.blueTeamColor || null,
        redTeamName: room.redTeamName || null,
        redTeamLogo: room.redTeamLogo || null,
        redTeamColor: room.redTeamColor || null,
        casterClientIds: room.casterClientIds ?? [],
        spectatorDelay: room.spectatorDelay ?? 0,
        discordWebhookUrl: room.discordWebhookUrl ?? null,
        isPublic: room.isPublic ?? true,
      });
      if (room.builds) {
        setRealtimeBuildCount(room.builds.length);
        setRealtimeBuilds(room.builds);
      } else if (data.builds) {
        setRealtimeBuildCount(data.builds.length);
        setRealtimeBuilds(data.builds);
      }
      if (data.costCatalog) {
        setRealtimeCostCatalog(data.costCatalog);
      }
    } catch {
      // Silently fail — next event will retry
    } finally {
      fetchingRef.current = false;
    }
  }, [roomCode, setRealtimeLogs, setRealtimeStatus, setRealtimeRoom, setRealtimeBuildCount, setRealtimeBuilds, setRealtimeCostCatalog]);

  // Register fetchRoomData in store so DraftBoard can call it
  useEffect(() => {
    setFetchRoomData(fetchRoomData);
    return () => setFetchRoomData(null);
  }, [fetchRoomData, setFetchRoomData]);

  // Initial hydration
  useEffect(() => {
    fetchRoomData();
  }, [fetchRoomData]);

  // ── BroadcastChannel: same-browser cross-tab instant sync ──
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;

    const bc = new BroadcastChannel(CHANNEL_NAME);
    bcRef.current = bc;

    bc.onmessage = (event) => {
      const msg = event.data;
      if (!msg || msg.roomId !== roomId) return;

      if (msg.type === "DRAFT_UPDATE") {
        // Immediately merge new log entries from the other tab
        if (Array.isArray(msg.newLogs)) {
          for (const entry of msg.newLogs) {
            mergeLogEntry(entry);
          }
        }
        // Also trigger a full fetch for consistency
        fetchRoomData();
      } else if (msg.type === "ROOM_UPDATE") {
        fetchRoomData();
      }
    };

    return () => {
      bc.close();
      bcRef.current = null;
    };
  }, [roomId, mergeLogEntry, fetchRoomData]);

  // ── Supabase realtime: cross-device sync ──
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      // Fallback: short polling
      const interval = setInterval(fetchRoomData, 2000);
      return () => clearInterval(interval);
    }

    const channel = supabase
      .channel(`room-${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "Room", filter: `id=eq.${roomId}` }, (payload) => {
        // Inline merge status change
        if (payload.new && typeof payload.new === "object" && "status" in payload.new) {
          setRealtimeStatus(payload.new.status as string);
        }
        fetchRoomData();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "DraftLog", filter: `roomId=eq.${roomId}` }, (payload) => {
        // Inline merge new log entry instantly (before fetch completes)
        if (payload.new && typeof payload.new === "object") {
          const row = payload.new as Record<string, unknown>;
          mergeLogEntry({
            player: String(row.player ?? ""),
            action: String(row.action ?? ""),
            characterId: String(row.characterId ?? ""),
            turnNumber: Number(row.turnNumber ?? 0),
            createdAt: String(row.createdAt ?? row.created_at ?? new Date().toISOString()),
          });
        }
        // Also full fetch for complete consistency
        fetchRoomData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "CharacterBuild", filter: `roomId=eq.${roomId}` }, () => fetchRoomData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, fetchRoomData, setRealtimeStatus, mergeLogEntry]);

  // ── Supabase broadcast: preview selections from other players ──
  const setPreviewSelections = useDraftStore((s) => s.setPreviewSelections);
  const clearPreviewSelections = useDraftStore((s) => s.clearPreviewSelections);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const myClientId = getOrCreateClientId();
    const previewChan = supabase.channel(`preview-${roomCode}`);

    previewChan
      .on("broadcast", { event: "preview" }, (payload) => {
        const data = payload.payload;
        // Don't show own preview (we already see it locally)
        if (data.clientId === myClientId) return;
        setPreviewSelections({ player: data.player, characterIds: data.characterIds });
      })
      .on("broadcast", { event: "preview_clear" }, (payload) => {
        const data = payload.payload;
        if (data.clientId === myClientId) return;
        clearPreviewSelections();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(previewChan);
    };
  }, [roomCode, setPreviewSelections, clearPreviewSelections]);

  // ── Supabase broadcast: ready check from captains ──
  const setBlueReady = useDraftStore((s) => s.setBlueReady);
  const setRedReady = useDraftStore((s) => s.setRedReady);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const myClientId = getOrCreateClientId();
    const readyChan = supabase.channel(`ready-${roomCode}`);

    readyChan
      .on("broadcast", { event: "ready" }, (payload) => {
        const data = payload.payload;
        if (data.clientId === myClientId) return;
        if (data.team === "BLUE") {
          setBlueReady(!!data.ready);
        } else if (data.team === "RED") {
          setRedReady(!!data.ready);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(readyChan);
    };
  }, [roomCode, setBlueReady, setRedReady]);

  return null;
}

// ── Broadcast preview: send character selection to all users ──
export function broadcastPreview(roomId: string, player: string, characterIds: string[], clientId: string) {
  const supabase = getBroadcastSupabase();
  if (!supabase) return;

  // Ensure channel exists
  if (!_previewChannel || _previewRoomId !== roomId) {
    if (_previewChannel) {
      supabase.removeChannel(_previewChannel);
    }
    _previewChannel = supabase.channel(`preview-${roomId}`);
    _previewChannel.subscribe();
    _previewRoomId = roomId;
  }

  _previewChannel.send({
    type: "broadcast",
    event: "preview",
    payload: { player, characterIds, clientId },
  });
}

export function broadcastPreviewClear(roomId: string, clientId: string) {
  const supabase = getBroadcastSupabase();
  if (!supabase || !_previewChannel) return;

  _previewChannel.send({
    type: "broadcast",
    event: "preview_clear",
    payload: { clientId },
  });
}

// ── Utility: broadcast a draft update to other tabs ──
export function broadcastDraftUpdate(roomId: string, newLogs: { player: string; action: string; characterId: string; turnNumber: number; createdAt?: string }[]) {
  if (typeof BroadcastChannel === "undefined") return;
  try {
    const bc = new BroadcastChannel(CHANNEL_NAME);
    bc.postMessage({ type: "DRAFT_UPDATE", roomId, newLogs });
    bc.close();
  } catch {
    // BroadcastChannel not available
  }
}

export function broadcastRoomUpdate(roomId: string) {
  if (typeof BroadcastChannel === "undefined") return;
  try {
    const bc = new BroadcastChannel(CHANNEL_NAME);
    bc.postMessage({ type: "ROOM_UPDATE", roomId });
    bc.close();
  } catch {
    // BroadcastChannel not available
  }
}

// ── Broadcast ready status: send ready toggle to all users ──
let _readyChannel: ReturnType<BrowserSupabaseClient["channel"]> | null = null;
let _readyRoomCode: string | null = null;

export function broadcastReady(roomCode: string, team: string, ready: boolean, clientId: string) {
  const supabase = getBroadcastSupabase();
  if (!supabase) return;

  if (!_readyChannel || _readyRoomCode !== roomCode) {
    if (_readyChannel) {
      supabase.removeChannel(_readyChannel);
    }
    _readyChannel = supabase.channel(`ready-${roomCode}`);
    _readyChannel.subscribe();
    _readyRoomCode = roomCode;
  }

  _readyChannel.send({
    type: "broadcast",
    event: "ready",
    payload: { team, ready, clientId },
  });
}
