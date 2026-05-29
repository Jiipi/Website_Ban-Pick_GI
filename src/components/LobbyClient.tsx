"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Gamepad2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import { authFetch, getCurrentTabUser, getOrCreateClientId, setSession, syncClientIdCookie } from "@/lib/auth";
import { playClickSound, playConfirmSound, playErrorSound } from "@/lib/sounds";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { PlayerProfile } from "./PlayerProfile";

export function LobbyClient() {
  const router = useRouter();
  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [registered, setRegistered] = useState(false);
  const [invite, setInvite] = useState<{
    roomCode: string;
    team: string;
    hostName?: string;
  } | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [clientId, setClientId] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(async () => {
      if (!cancelled) {
        const user = await getCurrentTabUser();
        if (!user) {
          router.replace("/login?redirect=/lobby");
          return;
        }

        const cid = getOrCreateClientId();
        setClientId(cid);
        setCheckingAuth(false);

        const profileResponse = await authFetch("/api/profile", { cache: "no-store" });
        if (cancelled || !profileResponse.ok) return;
        const profileBody = await profileResponse.json().catch(() => null);
        const savedUid = typeof profileBody?.profile?.uid === "string" ? profileBody.profile.uid : "";
        if (savedUid) {
          setUid(savedUid);
          void registerLobby(cid, "");
        }
      }
    });
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Subscribe to lobby invite changes via Supabase Realtime
  useEffect(() => {
    if (!clientId || !registered) return;

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`lobby-${clientId}`)
      .on(
        "postgres_changes" as never,
        {
          event: "UPDATE",
          schema: "public",
          table: "LobbyPlayer",
          filter: `clientId=eq.${clientId}`,
        },
        (payload: { new: { status: string; roomCode?: string; team?: string } }) => {
          const record = payload.new;
          if (record.status === "INVITED" && record.roomCode) {
            setInvite({
              roomCode: record.roomCode,
              team: record.team ?? "BLUE",
            });
          } else if (record.status === "IN_ROOM") {
            setInvite(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, registered]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = uid.trim();
    if (!/^\d{9,10}$/.test(trimmed)) {
      setError("UID phải là 9-10 chữ số");
      playErrorSound();
      return;
    }

    setLoading(true);
    setError("");
    playClickSound();

    const cid = clientId || getOrCreateClientId();
    if (!clientId) setClientId(cid);

    await registerLobby(cid, trimmed);
  }

  async function registerLobby(cid: string, uidToRegister: string) {
    setLoading(true);
    const payload: Record<string, string> = { clientId: cid };
    if (uidToRegister) payload.uid = uidToRegister;

    const response = await authFetch("/api/lobby", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.message ?? "Không xác thực được UID");
      playErrorSound();
      return;
    }

    setUid(data.player.uid);
    setNickname(data.player.displayName ?? data.player.nickname);
    setAvatarUrl(data.enka?.avatarUrl ?? "");
    setRegistered(true);
    playConfirmSound();
  }

  async function handleAccept() {
    if (!invite) return;
    setAccepting(true);
    playClickSound();

    const cid = clientId || getOrCreateClientId();

    const response = await authFetch(`/api/room/${invite.roomCode}/invite/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: cid }),
    });

    const data = await response.json();
    setAccepting(false);

    if (!response.ok) {
      setError(data.message ?? "Không thể chấp nhận lời mời");
      setInvite(null);
      playErrorSound();
      return;
    }

    playConfirmSound();

    setSession(invite.roomCode, {
      name: data.session.name,
      role: data.session.role,
      team: data.session.team,
    });
    await syncClientIdCookie(data.session.clientId ?? cid);

    router.push(`/room/${invite.roomCode}?cid=${encodeURIComponent(data.session.clientId ?? cid)}`);
  }

  async function handleDecline() {
    if (!invite) return;
    playClickSound();

    const cid = clientId || getOrCreateClientId();

    await authFetch(`/api/room/${invite.roomCode}/invite/accept`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: cid }),
    });

    setInvite(null);
    setError("");
  }

  const handleLeaveLobby = useCallback(async () => {
    const cid = clientId || getOrCreateClientId();
    await authFetch("/api/lobby", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: cid }),
    });
    setRegistered(false);
    setNickname("");
    setAvatarUrl("");
    setInvite(null);
  }, [clientId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (registered) {
        handleLeaveLobby();
      }
    };
  }, [registered, handleLeaveLobby]);

  if (checkingAuth) {
    return (
      <section className="glass-strong mx-auto w-full max-w-xl rounded-3xl p-8 text-center text-sm text-slate-400">
        <Loader2 size={18} className="mx-auto mb-3 animate-spin text-cyan-300" />
        Äang kiá»ƒm tra phiĂªn Ä‘Äƒng nháº­p...
      </section>
    );
  }

  return (
    <section className="glass-strong mx-auto w-full max-w-xl rounded-3xl p-8 sm:p-10">
      {/* Invite notification */}
      {invite && (
        <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/[0.06] p-5">
          <div className="text-center">
            <h2 className="text-lg font-bold text-amber-200">Bạn được mời vào trận!</h2>
            <p className="mt-2 text-sm text-slate-300">
              Mã phòng: <strong className="font-mono text-white">{invite.roomCode}</strong>
            </p>
            <p className="text-sm text-slate-300">
              Team:{" "}
              <strong className={invite.team === "BLUE" ? "text-cyan-300" : "text-rose-300"}>
                {invite.team === "BLUE" ? "Đội Xanh" : "Đội Đỏ"}
              </strong>
            </p>
            <div className="mt-4 flex gap-3 justify-center">
              <button
                className="btn-primary"
                onClick={handleAccept}
                disabled={accepting}
                type="button"
              >
                {accepting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang vào...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Chấp nhận
                  </>
                )}
              </button>
              <button
                className="btn-outline"
                onClick={handleDecline}
                type="button"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="home-hero" style={{ marginBottom: "2rem" }}>
        <div className="home-hero__icon" style={{ background: "rgba(16, 185, 129, 0.08)", borderColor: "rgba(16, 185, 129, 0.18)", color: "#6ee7b7" }}>
          <Gamepad2 size={22} />
        </div>
        <p className="home-hero__eyebrow">Player Lobby</p>
        <h1 className="home-hero__title">Sảnh Chờ</h1>
      </div>

      {!registered ? (
        <form onSubmit={handleVerify}>
          <label className="block text-sm font-medium text-slate-400 mb-2">
            Nhập Genshin UID
          </label>
          <input
            className="input-field font-mono tracking-[0.1em]"
            value={uid}
            onChange={(e) => {
              setUid(e.target.value.replace(/\D/g, "").slice(0, 10));
              setError("");
            }}
            placeholder="VD: 600012345"
            maxLength={10}
            inputMode="numeric"
          />
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Nhập UID để trọng tài xác nhận danh tính và mời bạn vào trận.
          </p>

          <button
            className="btn-primary mt-5 w-full"
            disabled={loading || uid.length < 9}
            type="submit"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang xác thực...
              </>
            ) : (
              <>
                Xác thực UID
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="text-center">
          {avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={nickname}
              className="mx-auto h-20 w-20 rounded-full border-2 border-cyan-500/30 shadow-lg shadow-cyan-500/10"
            />
          )}
          <h2 className="mt-3 text-xl font-bold text-white">{nickname}</h2>
          <p className="text-sm text-slate-400">UID: {uid}</p>

          <div className="mt-5 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.04] p-4">
            <div className="flex items-center justify-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-sm font-medium text-emerald-300">Đang chờ trọng tài mời...</p>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Khi có trọng tài mời, bạn sẽ thấy thông báo tại đây.
            </p>
          </div>

          <button
            type="button"
            onClick={() => { setShowProfile((v) => !v); playClickSound(); }}
            className="lobby-toggle-profile"
          >
            <User size={14} />
            {showProfile ? "Ẩn hồ sơ" : "Hồ sơ cá nhân"}
            <ChevronDown
              size={14}
              style={{
                transition: "transform 0.2s ease",
                transform: showProfile ? "rotate(180deg)" : "rotate(0)",
              }}
            />
          </button>

          {showProfile && (
            <div className="mt-4 text-left">
              <PlayerProfile clientId={clientId} />
            </div>
          )}

          <button
            className="btn-outline mt-5"
            onClick={handleLeaveLobby}
            type="button"
          >
            <LogOut size={14} />
            Rời sảnh chờ
          </button>
        </div>
      )}

      {error && (
        <p className="mt-5 flex items-start gap-2 rounded-lg border border-red-800/40 bg-red-950/30 px-4 py-3 text-sm text-red-200 text-center">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          {error}
        </p>
      )}

      <div className="mt-8 flex flex-col items-center gap-2 text-center">
        <Link
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
          href="/"
        >
          <ArrowLeft size={14} />
          Quay về trang chủ
        </Link>
      </div>
    </section>
  );
}
