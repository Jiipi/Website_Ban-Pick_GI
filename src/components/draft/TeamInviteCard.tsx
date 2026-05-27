"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X, Send, Loader2, Search } from "lucide-react";
import { playClickSound, playConfirmSound, playErrorSound } from "@/lib/sounds";

type TeamInviteCardProps = {
  roomCode: string;
  clientId: string;
  team: "BLUE" | "RED";
  taken: boolean;
  playerName: string | null;
  playerNickname: string | null;
  playerUid: string | null;
  playerAvatarUrl: string | null;
  isHost: boolean;
};

type OnlinePlayer = {
  uid: string;
  nickname: string;
  avatarUrl: string | null;
  updatedAt: string;
};

export function TeamInviteCard({
  roomCode,
  clientId,
  team,
  taken,
  playerName,
  playerNickname,
  playerUid,
  playerAvatarUrl,
  isHost,
}: TeamInviteCardProps) {
  const router = useRouter();
  const [uid, setUid] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("success");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const isBlue = team === "BLUE";
  const teamLabel = isBlue ? "Đội Xanh" : "Đội Đỏ";
  const teamSide = isBlue ? "blue" : "red";
  const cardClass = taken
    ? isBlue
      ? "slot-filled-blue"
      : "slot-filled-red"
    : "slot-empty";

  const fetchOnlinePlayers = useCallback(async () => {
    setLoadingSuggestions(true);
    try {
      const response = await fetch("/api/lobby/online", { cache: "no-store" });
      if (!response.ok) {
        setOnlinePlayers([]);
        return;
      }
      const data = await response.json();
      setOnlinePlayers(data.players ?? []);
    } catch {
      setOnlinePlayers([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    if (!isHost || taken) return;
    queueMicrotask(fetchOnlinePlayers);
    const id = setInterval(fetchOnlinePlayers, 8000);
    return () => clearInterval(id);
  }, [isHost, taken, fetchOnlinePlayers]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = uid.trim()
    ? onlinePlayers.filter(
        (p) =>
          p.uid.includes(uid.trim()) ||
          p.nickname.toLowerCase().includes(uid.trim().toLowerCase()),
      )
    : onlinePlayers;

  function selectSuggestion(player: OnlinePlayer) {
    setUid(player.uid);
    setShowSuggestions(false);
    playClickSound();
  }

  async function invitePlayer(uidToInvite?: string) {
    const target = (uidToInvite ?? uid).trim();
    if (!target) return;
    setBusy("INVITE");
    setMsg("");
    setShowSuggestions(false);
    playClickSound();

    const response = await fetch(`/api/room/${roomCode}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, uid: target, team }),
    });

    const data = await response.json();
    setBusy(null);

    if (!response.ok) {
      setMsg(data.message ?? "Không mời được");
      setMsgType("error");
      playErrorSound();
      return;
    }

    setMsg(data.message ?? "Đã mời thành công!");
    setMsgType("success");
    setUid("");
    playConfirmSound();
    router.refresh();
  }

  async function kickPlayer() {
    if (!confirm(`Kick người chơi ${teamLabel}?`)) return;
    setBusy("KICK");
    setMsg("");
    playClickSound();

    const response = await fetch(`/api/room/${roomCode}/host`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, action: "KICK_PLAYER", target: team }),
    });

    setBusy(null);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setMsg(data.message ?? "Kick thất bại");
      setMsgType("error");
      playErrorSound();
      return;
    }

    playConfirmSound();
    router.refresh();
  }

  return (
    <div className={`wt-team-card ${cardClass}`}>
      <span className={`wt-team-dot ${taken ? "dot-active" : ""}`} aria-hidden="true" />

      {/* Avatar ring wrapper */}
      <div className={`wt-avatar-ring wt-avatar-ring--${teamSide}`}>
        {taken && playerAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={playerAvatarUrl}
            alt=""
            className={`wt-team-avatar wt-team-avatar--${teamSide}`}
          />
        ) : (
          <div className={`wt-team-orb wt-team-orb--${teamSide}`} aria-hidden="true" />
        )}
      </div>

      <h3 className={`wt-team-name wt-team-name--${taken ? teamSide : "neutral"}`}>
        {teamLabel}
      </h3>

      {taken ? (
        <div className="wt-team-player-info">
          <span className="wt-team-player-name">{playerNickname ?? playerName}</span>
          {playerUid && <span className="wt-team-player-uid">UID: {playerUid}</span>}
          {isHost && (
            <button
              className="wt-team-kick-btn"
              onClick={kickPlayer}
              disabled={busy !== null}
              type="button"
            >
              {busy === "KICK" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <X size={12} />
              )}
              Kick
            </button>
          )}
        </div>
      ) : (
        <div className="wt-team-invite-area" ref={wrapRef}>
          {isHost ? (
            <>
              <div className="wt-team-invite-form">
                <div className="wt-uid-input-wrap">
                  <Search size={13} className="wt-uid-input-icon" />
                  <input
                    className="wt-team-uid-input"
                    value={uid}
                    onChange={(e) => {
                      setUid(e.target.value.replace(/\D/g, "").slice(0, 10));
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="UID hoặc chọn từ danh sách"
                    maxLength={10}
                    inputMode="numeric"
                  />
                </div>
                <button
                  className="wt-team-invite-btn"
                  disabled={busy !== null || uid.length < 9}
                  onClick={() => invitePlayer()}
                  type="button"
                >
                  {busy === "INVITE" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={13} />
                      Mời
                    </>
                  )}
                </button>
              </div>

              {showSuggestions && (
                <div className="wt-suggestions">
                  <div className="wt-suggestions-head">
                    <span className="wt-suggestions-title">
                      <UserPlus size={11} />
                      Player online ({filtered.length})
                    </span>
                    {loadingSuggestions && <Loader2 size={11} className="animate-spin wt-suggestions-spinner" />}
                  </div>
                  {filtered.length === 0 ? (
                    <p className="wt-suggestions-empty">
                      {onlinePlayers.length === 0
                        ? "Chưa có player nào trong sảnh chờ."
                        : "Không khớp với từ khóa."}
                    </p>
                  ) : (
                    <ul className="wt-suggestions-list">
                      {filtered.slice(0, 6).map((p) => (
                        <li key={p.uid}>
                          <button
                            type="button"
                            className="wt-suggestion-item"
                            onClick={() => selectSuggestion(p)}
                          >
                            {p.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.avatarUrl}
                                alt=""
                                className="wt-suggestion-avatar"
                              />
                            ) : (
                              <span className="wt-suggestion-avatar wt-suggestion-avatar--placeholder">
                                {p.nickname.charAt(0).toUpperCase()}
                              </span>
                            )}
                            <span className="wt-suggestion-meta">
                              <span className="wt-suggestion-name">{p.nickname}</span>
                              <span className="wt-suggestion-uid">UID {p.uid}</span>
                            </span>
                            <span className="wt-suggestion-online" aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {msg && (
                <p className={`wt-team-msg ${msgType === "error" ? "wt-msg-error" : "wt-msg-success"}`}>
                  {msg}
                </p>
              )}
            </>
          ) : (
            <p className="wt-team-waiting-text">Đang chờ player...</p>
          )}
        </div>
      )}
    </div>
  );
}
