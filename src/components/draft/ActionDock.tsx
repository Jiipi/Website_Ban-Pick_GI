"use client";

import { useRouter } from "next/navigation";
import { MessageCircle, Settings } from "lucide-react";
import { RoleBadge } from "./RoleBadge";
import { UndoButton } from "./UndoButton";
import { HostControls } from "@/components/HostControls";
import { LiveChat } from "@/components/LiveChat";
import { playClickSound } from "@/lib/sounds";
import { useDraft } from "./DraftContext";
import { useDraftStore } from "@/stores/draftStore";

type ActionDockProps = {
  submitTurn: () => Promise<void>;
  lastConfirmedTurn?: number | null;
};

export function ActionDock({ submitTurn, lastConfirmedTurn }: ActionDockProps) {
  const router = useRouter();
  const {
    roomCode,
    currentTurn,
    draftDone,
    ownedTeam,
    userIsHost,
    canAct,
    activeTeam,
    logs,
    totalTurns,
    status,
    buildCount,
    blueTaken,
    redTaken,
  } = useDraft();

  const selected = useDraftStore((s) => s.selected);
  const error = useDraftStore((s) => s.error);
  const loading = useDraftStore((s) => s.loading);
  const chatOpen = useDraftStore((s) => s.chatOpen);
  const toggleChat = useDraftStore((s) => s.toggleChat);
  const hostPanelOpen = useDraftStore((s) => s.hostPanelOpen);
  const toggleHostPanel = useDraftStore((s) => s.toggleHostPanel);
  const session = useDraftStore((s) => s.session);

  const turnLabel = draftDone
    ? "DRAFT COMPLETE"
    : `${currentTurn!.player} ${currentTurn!.action}`;

  const completedTurns = logs.filter((l) => l.action !== "CHAT").length;
  const progress = Math.min(100, (completedTurns / totalTurns) * 100);

  const confirmBtnClass = (() => {
    if (draftDone) return "btn-primary";
    const base = "btn-primary draft-confirm-btn";
    if (activeTeam === "BLUE") return `${base} confirm-blue`;
    if (activeTeam === "RED") return `${base} confirm-red`;
    return base;
  })();

  return (
    <>
      {error && <p className="draft-error">{error}</p>}

      <div className="draft-action-dock">
        {/* Progress bar */}
        <div className="draft-dock-progress" style={{ width: `${progress}%` }} />

        <RoleBadge
          userIsHost={userIsHost}
          ownedTeam={ownedTeam}
          sessionName={session?.name ?? null}
        />

        <div className="draft-action-status">
          {currentTurn ? (
            <>
              <span className={activeTeam === "BLUE" ? "text-cyan-300" : "text-rose-300"}>
                {turnLabel}
              </span>
              <span>
                {selected.length}/{currentTurn.quantity} selected
              </span>
              {!canAct && (
                <span className="text-slate-500">
                  Waiting for your turn
                </span>
              )}
            </>
          ) : (
            <span className="text-emerald-300">Draft complete</span>
          )}
        </div>

        <div className="draft-action-buttons">
          {userIsHost && session && (
            <button
              onClick={() => {
                toggleHostPanel();
                playClickSound();
              }}
              className={`draft-icon-button ${hostPanelOpen ? "is-active-gold" : ""}`}
              type="button"
              title="Host panel"
            >
              <Settings size={18} />
            </button>
          )}
          <button
            onClick={() => {
              toggleChat();
              playClickSound();
            }}
            className={`draft-icon-button ${chatOpen ? "is-active-blue" : ""}`}
            type="button"
            title="Chat"
          >
            <MessageCircle size={18} />
          </button>
          {draftDone ? (
            <button className="btn-primary" onClick={() => router.push(`/room/${roomCode}/build`)} type="button">
              Build phase
            </button>
          ) : (
            <>
              <UndoButton
                roomCode={roomCode}
                turnNumber={lastConfirmedTurn ?? 0}
                team={ownedTeam ?? ""}
                show={!!lastConfirmedTurn && !draftDone}
                onRequest={() => { /* broadcast handled by DraftBoard */ }}
              />
              <button
                className={confirmBtnClass}
                disabled={loading || !canAct || selected.length !== 1}
                onClick={submitTurn}
                type="button"
              >
                {loading ? "Saving..." : `Confirm ${selected.length}/1`}
              </button>
            </>
          )}
        </div>
      </div>

      {userIsHost && session && hostPanelOpen && (
        <div className="draft-host-panel">
          <HostControls
            roomCode={roomCode}
            clientId={session.clientId}
            status={status}
            hasDraftLogs={logs.length > 0}
            hasBuilds={buildCount > 0}
            blueTaken={blueTaken}
            redTaken={redTaken}
          />
        </div>
      )}

      {chatOpen && session && (
        <div className="draft-chat-panel">
          <LiveChat roomCode={roomCode} clientId={session.clientId} userName={session.name} />
        </div>
      )}
    </>
  );
}
