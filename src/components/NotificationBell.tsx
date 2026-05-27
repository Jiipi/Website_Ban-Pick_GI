"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, X, Inbox } from "lucide-react";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  async function fetchUnread() {
    try {
      const res = await fetch("/api/notifications/unread");
      if (!res.ok) return;
      const body = await res.json();
      setUnread(body.unread ?? 0);
    } catch {
      // silently
    }
  }

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const body = await res.json();
      if (res.ok) {
        setNotifs(body.notifications ?? []);
        setUnread(body.unread ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUnread();
    const id = setInterval(fetchUnread, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) fetchAll();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  }

  async function dismiss(id: string) {
    await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 transition-colors"
        aria-label="Thông báo"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-slate-700/40 bg-slate-900/95 backdrop-blur-md shadow-xl overflow-hidden z-50">
          <div className="flex items-center justify-between border-b border-slate-800/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <Inbox size={14} className="text-slate-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-200">Thông báo</span>
              {unread > 0 && (
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[9px] font-bold text-rose-200">
                  {unread} mới
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] font-bold text-cyan-300 hover:text-cyan-200 transition-colors"
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="py-10 text-center text-xs text-slate-400">Đang tải...</div>
            ) : notifs.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-2xl">📭</p>
                <p className="mt-2 text-xs text-slate-400">Không có thông báo nào</p>
              </div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  className={`group relative border-b border-slate-800/40 px-4 py-3 transition-colors hover:bg-slate-800/30 ${
                    n.read ? "" : "bg-cyan-500/5"
                  }`}
                >
                  {!n.read && (
                    <span className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-cyan-400" />
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {n.link ? (
                        <Link
                          href={n.link}
                          onClick={() => {
                            if (!n.read) markRead(n.id);
                            setOpen(false);
                          }}
                          className="block"
                        >
                          <p className="text-xs font-bold text-slate-200">{n.title}</p>
                          {n.body && <p className="mt-0.5 text-[11px] text-slate-400">{n.body}</p>}
                        </Link>
                      ) : (
                        <>
                          <p className="text-xs font-bold text-slate-200">{n.title}</p>
                          {n.body && <p className="mt-0.5 text-[11px] text-slate-400">{n.body}</p>}
                        </>
                      )}
                      <p className="mt-1 font-mono text-[9px] text-slate-500">{timeAgo(n.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.read && (
                        <button
                          onClick={() => markRead(n.id)}
                          className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-emerald-500/20 text-emerald-300"
                          title="Đánh dấu đã đọc"
                        >
                          <Check size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => dismiss(n.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-rose-500/20 text-rose-300"
                        title="Xoá"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `${minutes}p`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
