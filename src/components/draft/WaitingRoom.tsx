"use client";

import { Clipboard, Check, MessageSquare } from "lucide-react";
import { useState, useCallback } from "react";
import { HostControls } from "@/components/HostControls";
import { LiveChat } from "@/components/LiveChat";
import { TeamInviteCard } from "./TeamInviteCard";
import { RoleBadge } from "./RoleBadge";
import { ReadyCheck } from "./ReadyCheck";
import { CoinFlip } from "./CoinFlip";
import { ConstraintsEditor } from "./ConstraintsEditor";
import { PresetSelector } from "./PresetSelector";
import { TemplateSelector } from "./TemplateSelector";
import { SeriesSetup } from "./SeriesSetup";
import { TeamBrandingEditor } from "./TeamBrandingEditor";
import { BroadcastSettings } from "./BroadcastSettings";
import { WebhookSettings } from "./WebhookSettings";
import { playClickSound, playCopySound } from "@/lib/sounds";
import { useDraft } from "./DraftContext";
import { useDraftStore } from "@/stores/draftStore";
import { broadcastReady } from "@/components/RealtimeRefresh";
import type { Session } from "@/lib/types";
import type { TournamentConstraints } from "@/domain/tournament/TournamentConstraints";

type WaitingRoomProps = {
  session: Session | null;
};

export function WaitingRoom({ session }: WaitingRoomProps) {
  const {
    roomCode,
    status,
    logs,
    buildCount,
    blueTaken,
    redTaken,
    blue,
    red,
    userIsHost,
    ownedTeam,
  } = useDraft();

  const [copied, setCopied] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showCoinFlip, setShowCoinFlip] = useState(false);
  const [savedConstraints, setSavedConstraints] = useState<TournamentConstraints | null>(null);

  // Ready state from store
  const blueReady = useDraftStore((s) => s.blueReady);
  const redReady = useDraftStore((s) => s.redReady);
  const setBlueReady = useDraftStore((s) => s.setBlueReady);
  const setRedReady = useDraftStore((s) => s.setRedReady);

  const bothJoined = blueTaken && redTaken;

  function handleCopyCode() {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      playCopySound();
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const handleReadyToggle = useCallback(() => {
    if (!ownedTeam || !session) return;
    const currentReady = ownedTeam === "BLUE" ? blueReady : redReady;
    const newReady = !currentReady;

    // Update local store
    if (ownedTeam === "BLUE") {
      setBlueReady(newReady);
    } else {
      setRedReady(newReady);
    }

    // Broadcast to other clients
    broadcastReady(roomCode, ownedTeam, newReady, session.clientId);
  }, [ownedTeam, session, blueReady, redReady, setBlueReady, setRedReady, roomCode]);

  const handleCoinFlipComplete = useCallback(
    (_winner: "BLUE" | "RED", _choice: "PICK_FIRST" | "DEFER") => {
      // Close coin flip overlay
      setShowCoinFlip(false);
      // Future: use winner/choice to swap teams or set draft order
    },
    []
  );

  return (
    <div className="waiting-room">
      {/* Animated diagonal split line */}
      <div className="wt-diagonal-split" aria-hidden="true" />

      {/* Header */}
      <div className="waiting-header">
        <div className="waiting-header-left">
          <button className="draft-room-code" onClick={handleCopyCode} type="button">
            {copied ? <Check size={14} /> : <Clipboard size={14} />}
            <span>{roomCode}</span>
          </button>
          <RoleBadge
            userIsHost={userIsHost}
            ownedTeam={ownedTeam}
            sessionName={session?.name ?? null}
          />
        </div>
        <div className="waiting-header-right">
          <span className="waiting-status-badge">{status}</span>
        </div>
      </div>

      {/* Arena content */}
      <div className="wt-main">
        {/* Teams row — Blue vs Red */}
        <div className="wt-teams-row">
          <TeamInviteCard
            roomCode={roomCode}
            clientId={session?.clientId ?? ""}
            team="BLUE"
            taken={blueTaken}
            playerName={blue?.name ?? null}
            playerNickname={blue?.nickname ?? null}
            playerUid={blue?.uid ?? null}
            playerAvatarUrl={blue?.avatarUrl ?? null}
            isHost={userIsHost}
          />

          <div className="wt-vs-divider">
            <div className="wt-vs-ring" aria-hidden="true" />
            <span className="wt-vs-text">VS</span>
          </div>

          <TeamInviteCard
            roomCode={roomCode}
            clientId={session?.clientId ?? ""}
            team="RED"
            taken={redTaken}
            playerName={red?.name ?? null}
            playerNickname={red?.nickname ?? null}
            playerUid={red?.uid ?? null}
            playerAvatarUrl={red?.avatarUrl ?? null}
            isHost={userIsHost}
          />
        </div>

        {/* Ready check — shown when both teams have joined */}
        {bothJoined && (
          <ReadyCheck
            roomCode={roomCode}
            session={session}
            ownedTeam={ownedTeam}
            blueReady={blueReady}
            redReady={redReady}
            onReadyToggle={handleReadyToggle}
          />
        )}
      </div>

      {/* Host bar — fixed bottom dock */}
      {userIsHost && session && (
        <div className="wt-host-bar">
          <HostControls
            roomCode={roomCode}
            clientId={session.clientId}
            status={status}
            hasDraftLogs={logs.length > 0}
            hasBuilds={buildCount > 0}
            blueTaken={blueTaken}
            redTaken={redTaken}
            blueReady={blueReady}
            redReady={redReady}
          />
          <PresetSelector
            roomCode={roomCode}
            clientId={session.clientId}
            onApply={(preset) => setSavedConstraints(preset.constraints)}
          />
          <ConstraintsEditor
            roomCode={roomCode}
            clientId={session.clientId}
            constraints={savedConstraints}
            onSaved={setSavedConstraints}
          />
          <TemplateSelector
            roomCode={roomCode}
            clientId={session.clientId}
          />
          <SeriesSetup
            roomCode={roomCode}
            clientId={session.clientId}
            currentFormat={null}
            currentFearless={false}
          />
          <TeamBrandingEditor
            roomCode={roomCode}
            clientId={session.clientId}
          />
          <BroadcastSettings
            roomCode={roomCode}
            clientId={session.clientId}
            currentDelay={0}
            casterIds={[]}
          />
          <WebhookSettings
            roomCode={roomCode}
            clientId={session.clientId}
          />
          <div className="wt-chat-area">
            {/* Coin Flip trigger — only when both teams joined */}
            {bothJoined && (
              <button
                className="coin-flip-trigger"
                onClick={() => { setShowCoinFlip(true); playClickSound(); }}
                type="button"
              >
                🪙 Coin Flip
              </button>
            )}
            <button
              onClick={() => { setChatOpen(!chatOpen); playClickSound(); }}
              className="wt-chat-toggle"
              type="button"
            >
              <MessageSquare size={14} />
              {chatOpen ? "Đóng" : "Chat"}
            </button>
          </div>
        </div>
      )}

      {/* Player waiting bar — non-host */}
      {!userIsHost && (
        <div className="wt-player-msg">
          <p>⏳ Trọng tài sẽ bắt đầu trận đấu khi đủ 2 người chơi.</p>
        </div>
      )}

      {/* Chat panel — floating above bar */}
      {chatOpen && session && (
        <div className="wt-chat-container">
          <LiveChat roomCode={roomCode} clientId={session.clientId} userName={session.name} />
        </div>
      )}

      {/* Coin Flip overlay */}
      {showCoinFlip && (
        <CoinFlip
          onComplete={handleCoinFlipComplete}
          onCancel={() => setShowCoinFlip(false)}
        />
      )}
    </div>
  );
}
