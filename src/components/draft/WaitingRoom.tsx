"use client";

import { Check, Clipboard, MessageSquare } from "lucide-react";
import { useCallback, useState } from "react";
import { HostControls } from "@/components/HostControls";
import { LiveChat } from "@/components/LiveChat";
import { TeamInviteCard } from "./TeamInviteCard";
import { RoleBadge } from "./RoleBadge";
import { ReadyCheck } from "./ReadyCheck";
import { playClickSound, playCopySound } from "@/lib/sounds";
import { useDraft } from "./DraftContext";
import { useDraftStore } from "@/stores/draftStore";
import { broadcastReady } from "@/components/RealtimeRefresh";
import type { Session } from "@/lib/types";

type WaitingRoomProps = {
  session: Session | null;
};

const SERIES_FORMATS = ["BO1", "BO3", "BO5"] as const;

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
    seriesFormat,
    fearlessDraft,
  } = useDraft();

  const [copied, setCopied] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

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

    if (ownedTeam === "BLUE") {
      setBlueReady(newReady);
    } else {
      setRedReady(newReady);
    }

    broadcastReady(roomCode, ownedTeam, newReady, session.clientId);
  }, [ownedTeam, session, blueReady, redReady, setBlueReady, setRedReady, roomCode]);

  const playerCount = (blueTaken ? 1 : 0) + (redTaken ? 1 : 0);

  return (
    <div className="waiting-room">
      <div className="wt-diagonal-split" aria-hidden="true" />

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

      <div className="wt-dashboard">
        <main className="wt-main">
          <section className="wt-arena-card" aria-label="Match lobby">
            <div className="wt-arena-head">
              <span className="wt-arena-kicker">Match lobby</span>
              <span className="wt-arena-count">{playerCount}/2 players</span>
            </div>

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

            {bothJoined && (
              <div className="wt-ready-wrap">
                <ReadyCheck
                  roomCode={roomCode}
                  session={session}
                  ownedTeam={ownedTeam}
                  blueReady={blueReady}
                  redReady={redReady}
                  onReadyToggle={handleReadyToggle}
                />
              </div>
            )}
          </section>

          {userIsHost && session ? (
            <div className="wt-host-actions">
              <CompactSeriesFormat
                roomCode={roomCode}
                clientId={session.clientId}
                currentFormat={seriesFormat}
                currentFearless={fearlessDraft}
              />
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
              <div className="wt-chat-area">
                <button
                  onClick={() => {
                    setChatOpen(!chatOpen);
                    playClickSound();
                  }}
                  className="wt-chat-toggle"
                  type="button"
                >
                  <MessageSquare size={14} />
                  {chatOpen ? "Close chat" : "Chat"}
                </button>
              </div>
            </div>
          ) : (
            <div className="wt-player-msg">
              <p>Waiting for the host to start when both players are ready.</p>
            </div>
          )}
        </main>
      </div>

      {chatOpen && session && (
        <div className="wt-chat-container">
          <LiveChat roomCode={roomCode} clientId={session.clientId} userName={session.name} />
        </div>
      )}

    </div>
  );
}

function CompactSeriesFormat({
  roomCode,
  clientId,
  currentFormat,
  currentFearless,
}: {
  roomCode: string;
  clientId: string;
  currentFormat: string | null;
  currentFearless: boolean;
}) {
  const [saving, setSaving] = useState<string | null>(null);
  const [optimisticFormat, setOptimisticFormat] = useState<string | null>(null);
  const selectedFormat = optimisticFormat ?? currentFormat ?? "BO1";

  async function setFormat(format: (typeof SERIES_FORMATS)[number]) {
    if (saving || format === selectedFormat) return;
    setSaving(format);
    setOptimisticFormat(format);
    playClickSound();

    try {
      await fetch(`/api/room/${roomCode}/host`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_SERIES_FORMAT",
          clientId,
          format,
          fearless: currentFearless,
        }),
      });
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="wt-format-compact" aria-label="Series format">
      <span className="wt-format-label">Format</span>
      <div className="wt-format-options">
        {SERIES_FORMATS.map((format) => (
          <button
            key={format}
            className={`wt-format-btn ${selectedFormat === format ? "is-active" : ""}`}
            disabled={saving !== null}
            onClick={() => setFormat(format)}
            type="button"
          >
            {saving === format ? "..." : format.replace("BO", "Bo")}
          </button>
        ))}
      </div>
    </div>
  );
}
