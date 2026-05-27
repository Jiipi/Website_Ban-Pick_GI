"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Globe, Users, Trophy, Swords, UserPlus, Sparkles, RefreshCw } from "lucide-react";

type Event = {
  id: string;
  actorUid: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

type Scope = "global" | "friends";

export function FeedClient() {
  const [scope, setScope] = useState<Scope>("global");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(s: Scope) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/feed?scope=${s}&limit=50`);
      const body = await res.json();
      if (!res.ok) {
        setError(body.message ?? "Không tải được bảng tin");
        setEvents([]);
      } else {
        setEvents(body.events ?? []);
      }
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(scope);
  }, [scope]);

  return (
    <div className="space-y-5 animate-fade-in-up delay-100">
      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <TabButton active={scope === "global"} onClick={() => setScope("global")} icon={<Globe size={14} />}>
            Cộng đồng
          </TabButton>
          <TabButton active={scope === "friends"} onClick={() => setScope("friends")} icon={<Users size={14} />}>
            Bạn bè
          </TabButton>
        </div>
        <button
          onClick={() => load(scope)}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl bg-slate-800/40 px-3 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800/70 hover:text-slate-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="glass-strong rounded-3xl py-16 text-center">
          <p className="text-sm text-slate-400">Đang tải...</p>
        </div>
      ) : error ? (
        <div className="glass-strong rounded-3xl py-16 text-center">
          <p className="text-3xl">⚠️</p>
          <p className="mt-3 font-bold text-slate-300">Không tải được bảng tin</p>
          <p className="mt-1 text-sm text-slate-500">{error}</p>
          {scope === "friends" && (
            <Link href="/lobby" className="btn-primary mt-4">
              Vào sảnh chờ
            </Link>
          )}
        </div>
      ) : events.length === 0 ? (
        <div className="glass-strong rounded-3xl py-16 text-center">
          <p className="text-3xl">📭</p>
          <p className="mt-3 font-bold text-slate-300">
            {scope === "friends" ? "Bạn bè chưa có hoạt động" : "Chưa có hoạt động nào"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {scope === "friends"
              ? "Kết bạn thêm để theo dõi hoạt động."
              : "Hoàn tất một trận đấu hoặc tạo giải để hiển thị tại đây."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((e) => (
            <FeedItem key={e.id} event={e} />
          ))}
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
          ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/40"
          : "bg-slate-800/40 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function FeedItem({ event }: { event: Event }) {
  const meta = getEventMeta(event.type);
  const Item = (
    <div className="glass-strong rounded-2xl p-4 hover:ring-1 hover:ring-emerald-500/30 transition-all">
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.bg} ${meta.text}`}>
          {meta.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-slate-200 truncate">{event.title}</p>
            <span className="font-mono text-[10px] text-slate-500 shrink-0">
              {timeAgo(event.createdAt)}
            </span>
          </div>
          {event.body && <p className="mt-0.5 text-xs text-slate-400 truncate">{event.body}</p>}
          <p className="mt-1 font-mono text-[10px] text-slate-500">UID: {event.actorUid}</p>
        </div>
      </div>
    </div>
  );

  return event.link ? (
    <Link href={event.link} className="block">
      {Item}
    </Link>
  ) : (
    Item
  );
}

function getEventMeta(type: string): { icon: React.ReactNode; bg: string; text: string } {
  switch (type) {
    case "MATCH_FINISHED":
      return { icon: <Swords size={16} />, bg: "bg-cyan-500/10", text: "text-cyan-300" };
    case "TOURNAMENT_CREATED":
      return { icon: <Trophy size={16} />, bg: "bg-violet-500/10", text: "text-violet-300" };
    case "TOURNAMENT_FINISHED":
      return { icon: <Trophy size={16} />, bg: "bg-amber-500/10", text: "text-amber-300" };
    case "FRIEND_ADDED":
      return { icon: <UserPlus size={16} />, bg: "bg-emerald-500/10", text: "text-emerald-300" };
    default:
      return { icon: <Sparkles size={16} />, bg: "bg-slate-700/40", text: "text-slate-400" };
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `${minutes}p`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("vi-VN");
}
