"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clipboard } from "lucide-react";
import { DraftTimer } from "./DraftTimer";
import { PickGrid } from "./PickGrid";
import { PoolColumn } from "./PoolColumn";
import { PlayerCardCircle } from "./draft/PlayerCardCircle";
import { BanRow } from "./draft/BanRow";
import { RevealOverlay } from "./draft/RevealOverlay";
import { ActionDock } from "./draft/ActionDock";
import { TeamCompPanel } from "./draft/TeamCompPanel";
import { PauseOverlay } from "./draft/PauseOverlay";
import { SeriesScoreboard } from "./draft/SeriesScoreboard";
import { WaitingRoom } from "./draft/WaitingRoom";
import {
  DraftProvider,
  type DraftContextValue,
  type PlayerInfo,
} from "./draft/DraftContext";
import { PICKS_PER_TEAM, TURN_DURATION_SECONDS } from "@/lib/constants";
import {
  isCharacterUnavailable,
  type DraftEntry,
} from "@/lib/draft";
import { draftPolicy } from "@/domain/draft/DraftPolicy";
import type { GenshinCharacter } from "@/lib/genshin";
import { getOrCreateClientId, getSession } from "@/lib/auth";
import { canActOnTurn, getOwnedTeam, isHost } from "@/lib/permissions";
import type { TeamSide } from "@/lib/types";
import { useDraftStore } from "@/stores/draftStore";
import {
  playClickSound,
  playConfirmSound,
  playCopySound,
  playErrorSound,
} from "@/lib/sounds";
import { broadcastPreview, broadcastPreviewClear } from "./RealtimeRefresh";

type DraftBoardProps = {
  roomCode: string;
  characters: GenshinCharacter[];
  logs: DraftEntry[];
  status: string;
  hostName: string | null;
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
  buildCount: number;
  updatedAt: string;
  lastTurnStartedAt: string | null;
  draftTemplate: unknown;
};

function formatBankTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function latestTimestampIso(first?: string | Date | null, second?: string | Date | null): string | null {
  const firstMs = first ? new Date(first).getTime() : Number.NaN;
  const secondMs = second ? new Date(second).getTime() : Number.NaN;

  if (!Number.isFinite(firstMs) && !Number.isFinite(secondMs)) return null;
  if (!Number.isFinite(firstMs)) return new Date(secondMs).toISOString();
  if (!Number.isFinite(secondMs)) return new Date(firstMs).toISOString();
  return new Date(firstMs >= secondMs ? firstMs : secondMs).toISOString();
}

export function DraftBoard(props: DraftBoardProps) {
  const {
    roomCode,
    characters,
    logs,
    status,
    hostName,
    hostClientId,
    blueClientId,
    redClientId,
    bluePlayerName,
    redPlayerName,
    blueUid,
    redUid,
    blueNickname,
    redNickname,
    blueAvatarUrl,
    redAvatarUrl,
    buildCount,
    updatedAt,
    lastTurnStartedAt,
    draftTemplate,
  } = props;

  const router = useRouter();
  const selected = useDraftStore((s) => s.selected);
  const toggleSelected = useDraftStore((s) => s.toggleSelected);
  const clearSelected = useDraftStore((s) => s.clearSelected);
  const error = useDraftStore((s) => s.error);
  const setError = useDraftStore((s) => s.setError);
  const loading = useDraftStore((s) => s.loading);
  const setLoading = useDraftStore((s) => s.setLoading);
  const optimisticLogs = useDraftStore((s) => s.optimisticLogs);
  const addOptimisticLogs = useDraftStore((s) => s.addOptimisticLogs);
  const session = useDraftStore((s) => s.session);
  const setSessionState = useDraftStore((s) => s.setSession);
  const setHostPanelOpen = useDraftStore((s) => s.setHostPanelOpen);
  const previewSelections = useDraftStore((s) => s.previewSelections);
  const clearPreviewSelections = useDraftStore((s) => s.clearPreviewSelections);
  const revealQueue = useDraftStore((s) => s.revealQueue);
  const addReveal = useDraftStore((s) => s.addReveal);
  const popReveal = useDraftStore((s) => s.popReveal);
  const [copied, setCopied] = useState(false);
  const [lastConfirmedTurn, setLastConfirmedTurn] = useState<number | null>(null);
  const buildRefreshRef = useRef(false);
  const prevLogCountRef = useRef<number | null>(null);

  // ── Realtime data: prefer store over server props ──
  const realtimeLogs = useDraftStore((s) => s.realtimeLogs);
  const realtimeStatus = useDraftStore((s) => s.realtimeStatus);
  const realtimeRoom = useDraftStore((s) => s.realtimeRoom);
  const realtimeBuildCount = useDraftStore((s) => s.realtimeBuildCount);

  // Use realtime data if available, otherwise fallback to server props
  const liveLogs = realtimeLogs ?? logs;
  const liveStatus = realtimeStatus ?? status;
  const liveHostClientId = realtimeRoom?.hostClientId ?? hostClientId;
  const liveBlueClientId = realtimeRoom?.blueClientId ?? blueClientId;
  const liveRedClientId = realtimeRoom?.redClientId ?? redClientId;
  const liveBluePlayerName = realtimeRoom?.bluePlayerName ?? bluePlayerName;
  const liveRedPlayerName = realtimeRoom?.redPlayerName ?? redPlayerName;
  const liveBlueUid = realtimeRoom?.blueUid ?? blueUid;
  const liveRedUid = realtimeRoom?.redUid ?? redUid;
  const liveBlueNickname = realtimeRoom?.blueNickname ?? blueNickname;
  const liveRedNickname = realtimeRoom?.redNickname ?? redNickname;
  const liveBlueAvatarUrl = realtimeRoom?.blueAvatarUrl ?? blueAvatarUrl;
  const liveRedAvatarUrl = realtimeRoom?.redAvatarUrl ?? redAvatarUrl;
  const liveHostName = realtimeRoom?.hostName ?? hostName;
  const liveBuildCount = realtimeBuildCount ?? buildCount;

  useEffect(() => {
    setHostPanelOpen(liveStatus === "WAITING");
  }, [liveStatus, setHostPanelOpen]);

  useEffect(() => {
    getOrCreateClientId();
    try {
      setSessionState(getSession(roomCode));
    } catch {
      setSessionState(null);
    }
  }, [roomCode, setSessionState]);

  useEffect(() => {
    if (liveStatus !== "BUILDING" || buildRefreshRef.current) return;
    buildRefreshRef.current = true;
    router.refresh();
  }, [liveStatus, router]);

  const room = useMemo(
    () => ({ hostClientId: liveHostClientId, blueClientId: liveBlueClientId, redClientId: liveRedClientId, status: liveStatus }),
    [liveHostClientId, liveBlueClientId, liveRedClientId, liveStatus],
  );
  const characterMap = useMemo(() => new Map(characters.map((c) => [c.id, c])), [characters]);

  // Merge realtime logs with optimistic local logs
  const allLogs = useMemo(() => [...liveLogs, ...optimisticLogs], [liveLogs, optimisticLogs]);
  const draftTurnsForRoom = useMemo(
    () => draftPolicy.resolveTurns(realtimeRoom?.draftTemplate ?? draftTemplate),
    [realtimeRoom?.draftTemplate, draftTemplate],
  );
  const totalTurns = draftTurnsForRoom.length;

  const currentTurn = draftPolicy.getCurrentTurn(allLogs, draftTurnsForRoom);
  const ownedTeam = getOwnedTeam(room, session);
  const userIsHost = isHost(room, session);
  const canAct = canActOnTurn(room, session, currentTurn);

  // ── Watch for opponent's new log entries and trigger reveal ──
  useEffect(() => {
    if (!liveLogs || liveLogs.length === 0) {
      prevLogCountRef.current = liveLogs?.length ?? 0;
      return;
    }
    const prev = prevLogCountRef.current;
    prevLogCountRef.current = liveLogs.length;
    // Skip initial hydration
    if (prev === null) return;
    // Only process newly added entries
    if (liveLogs.length <= prev) return;
    const newEntries = liveLogs.slice(prev);
    for (const entry of newEntries) {
      // Skip if this was our own optimistic submission (already revealed)
      if (ownedTeam && entry.player === ownedTeam) continue;
      const char = characterMap.get(entry.characterId);
      if (char) {
        addReveal({
          characterId: entry.characterId,
          characterName: char.name,
          characterIconUrl: char.iconUrl,
          action: entry.action,
          team: entry.player,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveLogs?.length]);

  const turnStartedAt = useMemo(() => {
    if (!currentTurn) return new Date().toISOString();

    const previousLogs = allLogs.filter((log) => log.turnNumber < currentTurn.turnNumber);
    const latestPreviousLogAt = previousLogs.reduce<string | Date | null>(
      (latest, log) => latestTimestampIso(latest, log.createdAt),
      null,
    );
    const serverTurnStartedAt = realtimeRoom?.lastTurnStartedAt ?? lastTurnStartedAt;
    const authoritativeStart = latestTimestampIso(serverTurnStartedAt, latestPreviousLogAt);

    return authoritativeStart ?? realtimeRoom?.updatedAt ?? updatedAt;
  }, [allLogs, currentTurn, realtimeRoom?.lastTurnStartedAt, realtimeRoom?.updatedAt, lastTurnStartedAt, updatedAt]);

  const blueTaken = Boolean(liveBlueClientId);
  const redTaken = Boolean(liveRedClientId);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const bansBlue = allLogs.filter((log) => log.action === "BAN" && log.player === "BLUE");
  const bansRed = allLogs.filter((log) => log.action === "BAN" && log.player === "RED");
  const picksBlue = allLogs.filter((log) => log.action === "PICK" && log.player === "BLUE").slice(0, PICKS_PER_TEAM);
  const picksRed = allLogs.filter((log) => log.action === "PICK" && log.player === "RED").slice(0, PICKS_PER_TEAM);

  const draftDone = !currentTurn;
  const stepNumber = draftDone ? totalTurns : currentTurn.turnNumber;
  const actionIcon = !draftDone ? (currentTurn.action === "BAN" ? "⛔" : "🎯") : "";
  const turnLabel = draftDone ? "DRAFT COMPLETE" : `${actionIcon} ${currentTurn.player} ${currentTurn.action}`;
  const activeTeam: TeamSide | null = !draftDone ? currentTurn.player : null;
  const activeAction = !draftDone ? currentTurn.action : null;
  const activeBlueBanIndex = activeTeam === "BLUE" && activeAction === "BAN" ? bansBlue.length : -1;
  const activeRedBanIndex = activeTeam === "RED" && activeAction === "BAN" ? bansRed.length : -1;

  // ── Compute preview data for pick/ban slots ──
  // Combine: local player's own selection (self-preview) + remote player's broadcast
  const previewForBansBlue: string[] | undefined = (() => {
    if (activeTeam === "BLUE" && activeAction === "BAN") {
      // Self preview if we're the active player
      if (canAct && selected.length > 0) return selected;
      // Remote preview
      if (previewSelections?.player === "BLUE" && previewSelections.characterIds.length > 0) return previewSelections.characterIds;
    }
    return undefined;
  })();
  const previewForBansRed: string[] | undefined = (() => {
    if (activeTeam === "RED" && activeAction === "BAN") {
      if (canAct && selected.length > 0) return selected;
      if (previewSelections?.player === "RED" && previewSelections.characterIds.length > 0) return previewSelections.characterIds;
    }
    return undefined;
  })();
  const previewForPicksBlue: string[] | undefined = (() => {
    if (activeTeam === "BLUE" && activeAction === "PICK") {
      if (canAct && selected.length > 0) return selected;
      if (previewSelections?.player === "BLUE" && previewSelections.characterIds.length > 0) return previewSelections.characterIds;
    }
    return undefined;
  })();
  const previewForPicksRed: string[] | undefined = (() => {
    if (activeTeam === "RED" && activeAction === "PICK") {
      if (canAct && selected.length > 0) return selected;
      if (previewSelections?.player === "RED" && previewSelections.characterIds.length > 0) return previewSelections.characterIds;
    }
    return undefined;
  })();

  function toggleCharacter(characterId: string) {
    if (!canAct) return;
    if (isCharacterUnavailable(liveLogs, characterId)) return;
    playClickSound();
    toggleSelected(characterId, 1);

    // Broadcast preview to all users
    if (session && ownedTeam && currentTurn) {
      // Compute what the new selection will be after toggle
      const currentSelected = useDraftStore.getState().selected;
      broadcastPreview(roomCode, ownedTeam, currentSelected, session.clientId);
    }
  }

  async function submitTurn() {
    if (!session) return;
    if (!currentTurn) {
      router.push(`/room/${roomCode}/build`);
      return;
    }

    setLoading(true);
    setError("");

    // Optimistic: add local logs immediately for instant UI feedback
    const optimisticEntries: DraftEntry[] = selected.map((characterId, i) => ({
      id: `optimistic-${Date.now()}-${i}`,
      roomCode,
      turnNumber: currentTurn.turnNumber,
      player: ownedTeam!,
      action: currentTurn.action,
      characterId,
      createdAt: new Date().toISOString(),
    }));
    addOptimisticLogs(optimisticEntries);
    const submittedIds = [...selected];
    clearSelected();

    // Clear preview for all viewers
    if (session) {
      broadcastPreviewClear(roomCode, session.clientId);
      clearPreviewSelections();
    }

    const response = await fetch("/api/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomCode,
        clientId: session.clientId,
        player: ownedTeam,
        action: currentTurn.action,
        characterIds: submittedIds,
      }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      // Rollback optimistic logs on error
      useDraftStore.getState().removeOptimisticLogs(optimisticEntries);
      setError(data.message ?? "Could not save this turn");
      playErrorSound();
      return;
    }

    // Queue reveal animation for local submission
    for (const cid of submittedIds) {
      const char = characterMap.get(cid);
      if (char) {
        addReveal({
          characterId: cid,
          characterName: char.name,
          characterIconUrl: char.iconUrl,
          action: currentTurn.action,
          team: ownedTeam!,
        });
      }
    }

    playConfirmSound();
    setLastConfirmedTurn(currentTurn.turnNumber);

    if (currentTurn.turnNumber === totalTurns) {
      router.refresh();
    }

    // Don't removeOptimisticLogs here.
    // The RealtimeRefresh component will fetch new data from the API
    // and call setRealtimeLogs(), which automatically clears optimistic logs.
  }

  async function forceSkipCurrentTurn() {
    if (!session || !currentTurn) return;
    if (!userIsHost && ownedTeam !== currentTurn.player) return;
    playErrorSound();
    await fetch(`/api/room/${roomCode}/host`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: session.clientId, action: "FORCE_SKIP" }),
    });
    // RealtimeRefresh will pick up the change automatically
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      playCopySound();
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Pool layout: 1 column for PLAYER, 2 columns for HOST
  const isPlayerRole = ownedTeam && !userIsHost;
  const poolLayoutClass = isPlayerRole ? "draft-pool-layout-single" : "draft-pool-layout";

  // Turn vignette class
  const vignetteClass = activeTeam === "BLUE" ? "active-blue" : activeTeam === "RED" ? "active-red" : "";
  const stepPillColor = activeTeam === "BLUE" ? "turn-blue" : activeTeam === "RED" ? "turn-red" : "";

  const blue: PlayerInfo = { name: liveBluePlayerName, uid: liveBlueUid, nickname: liveBlueNickname, avatarUrl: liveBlueAvatarUrl };
  const red: PlayerInfo = { name: liveRedPlayerName, uid: liveRedUid, nickname: liveRedNickname, avatarUrl: liveRedAvatarUrl };

  const ctxValue: DraftContextValue = {
    roomCode, status: liveStatus, hostClientId: liveHostClientId, blueClientId: liveBlueClientId, redClientId: liveRedClientId, hostName: liveHostName,
    blue, red, session,
    currentTurn, logs: allLogs, characters, characterMap,
    ownedTeam, userIsHost, canAct,
    draftDone, stepNumber, totalTurns,
    activeTeam, activeAction,
    bansBlue, bansRed, picksBlue, picksRed,
    blueTaken, redTaken, buildCount: liveBuildCount,
    seriesFormat: realtimeRoom?.seriesFormat ?? null,
    fearlessDraft: realtimeRoom?.fearlessDraft ?? false,
  };

  const isWaiting = liveStatus === "WAITING";

  if (isWaiting) {
    const waitCtx: DraftContextValue = { ...ctxValue };

    return (
      <DraftProvider value={waitCtx}>
        <WaitingRoom session={session} />
      </DraftProvider>
    );
  }

  return (
    <DraftProvider value={ctxValue}>
      {/* Reveal overlay — plays cinematic animations for ban/pick */}
      {revealQueue.length > 0 && (
        <RevealOverlay
          key={revealQueue[0].characterId + "-" + revealQueue[0].action}
          characterId={revealQueue[0].characterId}
          characterName={revealQueue[0].characterName}
          characterIconUrl={revealQueue[0].characterIconUrl}
          action={revealQueue[0].action as "BAN" | "PICK"}
          team={revealQueue[0].team as "BLUE" | "RED"}
          onComplete={popReveal}
        />
      )}
      {/* Pause overlay */}
      {realtimeRoom?.isPaused && (
        <PauseOverlay
          isPaused={true}
          pausedAt={realtimeRoom.pausedAt ? String(realtimeRoom.pausedAt) : null}
          pauseReason={realtimeRoom.pauseReason ?? null}
          isHost={userIsHost}
          roomCode={roomCode}
          clientId={session?.clientId ?? ""}
        />
      )}
      <div className="draft-arena-shell">
        {/* Turn vignette */}
        <div className={`draft-turn-vignette ${vignetteClass}`} />

        <header className="draft-ban-header">
          <div className="draft-ban-zone draft-ban-zone-blue">
            <BanRow
              accent="blue"
              entries={bansBlue}
              characterMap={characterMap}
              activeIndex={activeBlueBanIndex}
              previewCharacterIds={previewForBansBlue}
            />
          </div>

          <button className="draft-room-code" onClick={handleCopyCode} type="button">
            {copied ? <Check size={14} /> : <Clipboard size={14} />}
            <span>{roomCode}</span>
          </button>

          <div className={`draft-step-pill ${stepPillColor}`}>
            <span>
              Step {stepNumber}/{totalTurns}: {turnLabel}
            </span>
          </div>

          {/* Series Scoreboard */}
          {realtimeRoom?.seriesId && realtimeRoom?.seriesFormat && realtimeRoom.seriesFormat !== "BO1" && (
            <SeriesScoreboard
              roomCode={roomCode}
              clientId={session?.clientId ?? ""}
              isHost={userIsHost}
              seriesId={realtimeRoom.seriesId}
              seriesFormat={realtimeRoom.seriesFormat}
              gameNumber={realtimeRoom.gameNumber ?? 1}
            />
          )}

          <div className="draft-ban-zone draft-ban-zone-red">
            <BanRow
              accent="red"
              entries={bansRed}
              characterMap={characterMap}
              activeIndex={activeRedBanIndex}
              previewCharacterIds={previewForBansRed}
            />
          </div>
        </header>

        <section className="draft-field">
          <div className="draft-player-anchor draft-player-anchor-blue">
            <PlayerCardCircle
              team="BLUE"
              name={liveBluePlayerName}
              uid={liveBlueUid}
              nickname={liveBlueNickname}
              avatarUrl={liveBlueAvatarUrl}
              isActive={activeTeam === "BLUE"}
            />
            <div className="draft-side-comp draft-side-comp-blue">
              <TeamCompPanel
                characterIds={picksBlue.map((e) => e.characterId).filter((id) => id !== "SKIPPED")}
                team="BLUE"
              />
            </div>
          </div>

          <div className="draft-pick-side draft-pick-side-blue">
            <PickGrid
              accent="blue"
              entries={picksBlue}
              characterMap={characterMap}
              isActive={activeTeam === "BLUE" && activeAction === "PICK"}
              previewCharacterIds={previewForPicksBlue}
            />
          </div>

          <div className="draft-center-clock">
            <DraftTimer
              duration={TURN_DURATION_SECONDS}
              turnStartedAt={turnStartedAt}
              active={!draftDone}
              onTimeout={forceSkipCurrentTurn}
              size={96}
              bankTime={activeTeam === "BLUE" ? (realtimeRoom?.blueBankTime ?? 120) : activeTeam === "RED" ? (realtimeRoom?.redBankTime ?? 120) : 0}
              activeTeam={activeTeam}
            />
            <p>{draftDone ? "Done" : "Turn Time"}</p>
            <div className="draft-bank-times">
              <span className={`draft-bank-blue ${activeTeam === "BLUE" ? "is-active" : ""}`}>
                BLUE<br />{formatBankTime(realtimeRoom?.blueBankTime ?? 120)}
              </span>
              <span className={`draft-bank-red ${activeTeam === "RED" ? "is-active" : ""}`}>
                RED<br />{formatBankTime(realtimeRoom?.redBankTime ?? 120)}
              </span>
            </div>
          </div>

          <div className="draft-pick-side draft-pick-side-red">
            <PickGrid
              accent="red"
              entries={picksRed}
              characterMap={characterMap}
              isActive={activeTeam === "RED" && activeAction === "PICK"}
              previewCharacterIds={previewForPicksRed}
            />
          </div>

          <div className="draft-player-anchor draft-player-anchor-red">
            <PlayerCardCircle
              team="RED"
              name={liveRedPlayerName}
              uid={liveRedUid}
              nickname={liveRedNickname}
              avatarUrl={liveRedAvatarUrl}
              isActive={activeTeam === "RED"}
            />
            <div className="draft-side-comp draft-side-comp-red">
              <TeamCompPanel
                characterIds={picksRed.map((e) => e.characterId).filter((id) => id !== "SKIPPED")}
                team="RED"
              />
            </div>
          </div>
        </section>

        {/* Pool section */}
        <section className={poolLayoutClass}>
          {isPlayerRole ? (
            <PoolColumn
              accent={activeTeam === "BLUE" ? "blue" : "red"}
              characters={characters}
              logs={liveLogs}
              selected={selectedSet}
              canAct={canAct}
              ownerSide={ownedTeam ?? "BLUE"}
              onToggle={toggleCharacter}
              teamPickIds={
                ownedTeam === "BLUE"
                  ? picksBlue.map((e) => e.characterId).filter((id) => id !== "SKIPPED")
                  : picksRed.map((e) => e.characterId).filter((id) => id !== "SKIPPED")
              }
            />
          ) : (
            <>
              <PoolColumn
                accent="blue"
                characters={characters}
                logs={liveLogs}
                selected={selectedSet}
                canAct={canAct}
                ownerSide="BLUE"
                onToggle={toggleCharacter}
                teamPickIds={picksBlue.map((e) => e.characterId).filter((id) => id !== "SKIPPED")}
              />
              <PoolColumn
                accent="red"
                characters={characters}
                logs={liveLogs}
                selected={selectedSet}
                canAct={canAct}
                ownerSide="RED"
                onToggle={toggleCharacter}
                teamPickIds={picksRed.map((e) => e.characterId).filter((id) => id !== "SKIPPED")}
              />
            </>
          )}
        </section>

        <ActionDock
          submitTurn={submitTurn}
          lastConfirmedTurn={lastConfirmedTurn}
        />
      </div>
    </DraftProvider>
  );
}
