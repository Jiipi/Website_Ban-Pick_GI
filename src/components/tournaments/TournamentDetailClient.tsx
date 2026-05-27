"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, UserPlus, Play, Users, Award } from "lucide-react";
import type { TournamentRecord, ParticipantRecord, MatchRecord } from "@/domain/tournament/Tournament";
import { BracketView } from "./BracketView";

type Props = {
  tournament: TournamentRecord;
  participants: ParticipantRecord[];
  matches: MatchRecord[];
  isOrganizer: boolean;
  isLoggedIn: boolean;
};

type Tab = "bracket" | "participants" | "info";

export function TournamentDetailClient({ tournament, participants, matches, isOrganizer, isLoggedIn }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(matches.length > 0 ? "bracket" : "participants");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Add participant form state
  const [uid, setUid] = useState("");
  const [nickname, setNickname] = useState("");

  async function addParticipant(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/tournaments/${tournament.slug}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerUid: uid.trim(),
          playerNickname: nickname.trim(),
          playerAvatarUrl: null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Thêm thất bại");
      } else {
        setUid("");
        setNickname("");
        router.refresh();
      }
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setBusy(false);
    }
  }

  async function generateBracket() {
    if (!confirm(`Tạo bracket với ${participants.length} đội? Trạng thái sẽ chuyển sang ONGOING.`)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/tournaments/${tournament.slug}/bracket`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Tạo bracket thất bại");
      } else {
        setTab("bracket");
        router.refresh();
      }
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setBusy(false);
    }
  }

  async function removeParticipant(playerUid: string) {
    if (!confirm("Xoá người chơi này khỏi giải?")) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        `/api/tournaments/${tournament.slug}/participants?playerUid=${encodeURIComponent(playerUid)}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Xoá thất bại");
      } else {
        router.refresh();
      }
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setBusy(false);
    }
  }

  const canAddParticipants = tournament.status === "UPCOMING" && participants.length < tournament.maxTeams;
  const canGenerateBracket = isOrganizer && tournament.status === "UPCOMING" && participants.length >= 2;

  return (
    <div className="space-y-5 animate-fade-in-up delay-100">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <TabButton active={tab === "bracket"} onClick={() => setTab("bracket")} icon={<Trophy size={14} />}>
          Bracket {matches.length > 0 && <span className="ml-1 text-[10px] text-slate-500">({matches.length})</span>}
        </TabButton>
        <TabButton active={tab === "participants"} onClick={() => setTab("participants")} icon={<Users size={14} />}>
          Đội tham gia ({participants.length})
        </TabButton>
        <TabButton active={tab === "info"} onClick={() => setTab("info")} icon={<Award size={14} />}>
          Thông tin
        </TabButton>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
          ⚠️ {error}
        </div>
      )}

      {/* Tab content */}
      {tab === "bracket" && (
        <div className="glass-strong rounded-3xl p-6">
          {matches.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-3xl">🎯</p>
              <p className="mt-2 font-bold text-slate-300">Chưa có bracket</p>
              <p className="mt-1 text-xs text-slate-500">
                Cần ít nhất 2 đội để tạo bracket. Hiện tại: {participants.length} đội.
              </p>
              {canGenerateBracket && (
                <button onClick={generateBracket} disabled={busy} className="btn-primary mt-4">
                  <Play size={14} />
                  {busy ? "Đang tạo..." : "Tạo bracket"}
                </button>
              )}
            </div>
          ) : (
            <BracketView matches={matches} participants={participants} isOrganizer={isOrganizer} />
          )}
        </div>
      )}

      {tab === "participants" && (
        <div className="glass-strong rounded-3xl p-6 space-y-4">
          {/* Add participant form */}
          {canAddParticipants && isLoggedIn && (
            <form onSubmit={addParticipant} className="rounded-2xl border border-slate-700/40 bg-slate-900/40 p-4 space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-violet-300 flex items-center gap-2">
                <UserPlus size={14} />
                Đăng ký tham gia
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  placeholder="UID người chơi (VD: 800000000)"
                  className="input-field font-mono"
                  required
                  pattern="[0-9]+"
                  maxLength={12}
                />
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Nickname"
                  className="input-field"
                  required
                  maxLength={50}
                />
              </div>
              <button type="submit" disabled={busy} className="btn-primary">
                <UserPlus size={14} />
                {busy ? "Đang thêm..." : "Thêm vào giải"}
              </button>
            </form>
          )}

          {/* Generate bracket */}
          {canGenerateBracket && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-amber-200">Sẵn sàng tạo bracket</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Có {participants.length} đội. Bracket sẽ tự động seed theo thứ tự đăng ký.
                </p>
              </div>
              <button onClick={generateBracket} disabled={busy} className="btn-primary shrink-0">
                <Play size={14} />
                Tạo bracket
              </button>
            </div>
          )}

          {/* Participants list */}
          {participants.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-3xl">👥</p>
              <p className="mt-2 font-bold text-slate-300">Chưa có đội tham gia</p>
            </div>
          ) : (
            <div className="space-y-2">
              {participants.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-700/40 bg-slate-900/40 px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs font-black text-violet-300 tabular-nums w-8 text-center">
                      #{p.seed ?? idx + 1}
                    </span>
                    {p.playerAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.playerAvatarUrl}
                        alt={p.playerNickname}
                        className="h-9 w-9 rounded-full border border-slate-700/60 object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-slate-500">
                        {p.playerNickname.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-slate-200 truncate">{p.playerNickname}</p>
                      <p className="font-mono text-[10px] text-slate-500">UID: {p.playerUid}</p>
                    </div>
                  </div>
                  {isOrganizer && tournament.status === "UPCOMING" && (
                    <button
                      onClick={() => removeParticipant(p.playerUid)}
                      disabled={busy}
                      className="text-[10px] font-bold text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Xoá
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "info" && (
        <div className="glass-strong rounded-3xl p-6 space-y-4">
          <InfoRow label="Slug" value={<span className="font-mono text-violet-300">{tournament.slug}</span>} />
          <InfoRow label="Format" value={
            tournament.format === "DOUBLE_ELIM" ? "Double Elimination" :
            tournament.format === "ROUND_ROBIN" ? "Round Robin" :
            "Single Elimination"
          } />
          <InfoRow label="Số đội tối đa" value={String(tournament.maxTeams)} />
          <InfoRow label="Trạng thái" value={tournament.status} />
          <InfoRow label="Tạo lúc" value={new Date(tournament.createdAt).toLocaleString("vi-VN")} />
          {tournament.startDate && (
            <InfoRow label="Ngày bắt đầu" value={new Date(tournament.startDate).toLocaleString("vi-VN")} />
          )}
          {tournament.endDate && (
            <InfoRow label="Ngày kết thúc" value={new Date(tournament.endDate).toLocaleString("vi-VN")} />
          )}
          <InfoRow label="Organizer" value={tournament.organizerName ?? "—"} />
          {tournament.prizeInfo && <InfoRow label="Giải thưởng" value={tournament.prizeInfo} />}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
        active
          ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/40"
          : "bg-slate-800/40 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-800/40 pb-2 last:border-0">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-200">{value}</span>
    </div>
  );
}
