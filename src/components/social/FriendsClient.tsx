"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus, Check, X, Trash2, Inbox, Send, Users as UsersIcon } from "lucide-react";

type Friend = {
  id: string;
  uid: string;
  nickname: string;
  avatarUrl: string | null;
  status: string;
  direction: "OUTGOING" | "INCOMING" | "MUTUAL";
  since: string;
};

type FriendsData = {
  me: { uid: string; nickname: string; avatarUrl: string | null };
  friends: Friend[];
  incoming: Friend[];
  outgoing: Friend[];
};

type Tab = "friends" | "incoming" | "outgoing";

export function FriendsClient() {
  const [data, setData] = useState<FriendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("friends");
  const [addUid, setAddUid] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/friends");
      const body = await res.json();
      if (!res.ok) {
        setError(body.message ?? "Không tải được dữ liệu");
        setData(null);
      } else {
        setData(body.data ?? body);
      }
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function sendRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!addUid.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addresseeUid: addUid.trim() }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.message ?? "Gửi lời mời thất bại");
      } else {
        setAddUid("");
        await load();
        setTab("outgoing");
      }
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setBusy(false);
    }
  }

  async function accept(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/friends/requests/${id}`, { method: "POST" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function reject(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/friends/requests/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function removeFriend(uid: string) {
    if (!confirm("Xoá khỏi danh sách bạn bè?")) return;
    setBusy(true);
    try {
      await fetch(`/api/friends?uid=${encodeURIComponent(uid)}`, { method: "DELETE" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="glass-strong rounded-3xl py-16 text-center animate-fade-in-up delay-100">
        <p className="text-sm text-slate-400">Đang tải...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-strong rounded-3xl py-16 text-center animate-fade-in-up delay-100">
        <p className="text-3xl">🔒</p>
        <p className="mt-3 font-bold text-slate-300">Cần đăng ký UID</p>
        <p className="mt-1 text-sm text-slate-500">{error || "Vào sảnh chờ và đăng ký UID để dùng tính năng bạn bè."}</p>
        <Link href="/lobby" className="btn-primary mt-4">
          Vào sảnh chờ
        </Link>
      </div>
    );
  }

  const list =
    tab === "friends" ? data.friends : tab === "incoming" ? data.incoming : data.outgoing;

  return (
    <div className="space-y-5 animate-fade-in-up delay-100">
      {/* Add friend form */}
      <form onSubmit={sendRequest} className="glass-strong rounded-3xl p-5 sm:p-6 space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2">
          <UserPlus size={14} />
          Thêm bạn bằng UID
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={addUid}
            onChange={(e) => setAddUid(e.target.value)}
            placeholder="VD: 800000000"
            className="input-field font-mono flex-1"
            pattern="[0-9]+"
            maxLength={12}
            required
          />
          <button type="submit" disabled={busy} className="btn-primary shrink-0">
            <UserPlus size={14} />
            Gửi
          </button>
        </div>
        {error && (
          <p className="text-xs text-rose-300">⚠️ {error}</p>
        )}
      </form>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <TabButton active={tab === "friends"} onClick={() => setTab("friends")} icon={<UsersIcon size={14} />} count={data.friends.length}>
          Bạn bè
        </TabButton>
        <TabButton active={tab === "incoming"} onClick={() => setTab("incoming")} icon={<Inbox size={14} />} count={data.incoming.length}>
          Lời mời đến
        </TabButton>
        <TabButton active={tab === "outgoing"} onClick={() => setTab("outgoing")} icon={<Send size={14} />} count={data.outgoing.length}>
          Đã gửi
        </TabButton>
      </div>

      {/* List */}
      <div className="glass-strong rounded-3xl p-5 sm:p-6">
        {list.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-3xl">
              {tab === "friends" ? "👥" : tab === "incoming" ? "📥" : "📤"}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {tab === "friends"
                ? "Chưa có bạn bè"
                : tab === "incoming"
                ? "Không có lời mời nào"
                : "Chưa gửi lời mời nào"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((f) => (
              <FriendRow
                key={f.id}
                friend={f}
                tab={tab}
                onAccept={(id) => accept(id)}
                onReject={(id) => reject(id)}
                onRemove={(uid) => removeFriend(uid)}
                busy={busy}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
        active
          ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-500/40"
          : "bg-slate-800/40 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
      }`}
    >
      {icon}
      {children}
      {count > 0 && <span className="ml-1 rounded-full bg-slate-900/60 px-2 py-0.5 text-[9px]">{count}</span>}
    </button>
  );
}

function FriendRow({
  friend,
  tab,
  onAccept,
  onReject,
  onRemove,
  busy,
}: {
  friend: Friend;
  tab: Tab;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onRemove: (uid: string) => void;
  busy: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-700/40 bg-slate-900/40 px-4 py-3">
      <Link href={`/players/${friend.uid}`} className="flex items-center gap-3 min-w-0 group">
        {friend.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={friend.avatarUrl}
            alt={friend.nickname}
            className="h-10 w-10 rounded-full border border-slate-700/60 object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-slate-500">
            {friend.nickname.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
            {friend.nickname}
          </p>
          <p className="font-mono text-[10px] text-slate-500">UID: {friend.uid}</p>
        </div>
      </Link>
      <div className="flex items-center gap-2 shrink-0">
        {tab === "incoming" && (
          <>
            <button
              onClick={() => onAccept(friend.id)}
              disabled={busy}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-colors"
              title="Chấp nhận"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => onReject(friend.id)}
              disabled={busy}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 transition-colors"
              title="Từ chối"
            >
              <X size={14} />
            </button>
          </>
        )}
        {tab === "outgoing" && (
          <button
            onClick={() => onReject(friend.id)}
            disabled={busy}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700/40 text-slate-400 hover:bg-rose-500/15 hover:text-rose-300 transition-colors"
            title="Huỷ lời mời"
          >
            <X size={14} />
          </button>
        )}
        {tab === "friends" && (
          <button
            onClick={() => onRemove(friend.uid)}
            disabled={busy}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700/40 text-slate-400 hover:bg-rose-500/15 hover:text-rose-300 transition-colors"
            title="Xoá bạn"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
