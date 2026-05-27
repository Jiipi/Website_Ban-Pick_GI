"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Crown, Send, Loader2 } from "lucide-react";
import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/constants";
import { playClickSound, playConfirmSound } from "@/lib/sounds";
import { createSupabaseBrowserClient } from "@/lib/supabase";

type Message = {
  id: number;
  sender: string;
  message: string;
  role: string;
  createdAt: string;
};

type LiveChatProps = {
  roomCode: string;
  clientId: string;
  userName: string;
  className?: string;
};

const POLL_INTERVAL_MS = 3000;

export function LiveChat({ roomCode, clientId, userName, className = "" }: LiveChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<Message[]>([]);

  // Keep ref in sync so polling/realtime callbacks always see latest list
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const mergeIncoming = useCallback((incoming: Message[]) => {
    if (incoming.length === 0) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const additions = incoming.filter((m) => !seen.has(m.id));
      if (additions.length === 0) return prev;
      const merged = [...prev, ...additions];
      merged.sort((a, b) => a.id - b.id);
      return merged;
    });
  }, []);

  const fetchMessages = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch(
        `/api/chat?roomCode=${roomCode}&clientId=${encodeURIComponent(clientId)}`,
        { signal, cache: "no-store" },
      );
      if (!res.ok) return;
      const data = await res.json();
      mergeIncoming(data.messages ?? []);
    } catch {
      // silent
    }
  }, [roomCode, clientId, mergeIncoming]);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      fetchMessages(controller.signal).finally(() => setLoading(false));
    });

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      ?.channel(`chat-${roomCode}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ChatMessage" },
        (payload) => {
          const msg = payload.new as Message;
          mergeIncoming([msg]);
        },
      )
      .subscribe();

    // Polling fallback: catches messages even if realtime publication is off
    const pollId = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      fetchMessages();
    }, POLL_INTERVAL_MS);

    return () => {
      controller.abort();
      window.clearInterval(pollId);
      if (channel) supabase?.removeChannel(channel);
    };
  }, [roomCode, fetchMessages, mergeIncoming]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !userName || sending) return;

    const text = input.trim();
    setInput("");
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode, clientId, sender: userName, message: text }),
      });

      if (res.ok) {
        playConfirmSound();
        const data = await res.json();
        mergeIncoming([data.message]);
      } else {
        setInput(text);
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Gửi thất bại");
      }
    } catch {
      setInput(text);
      setError("Lỗi kết nối");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function roleColor(role: string) {
    if (role === "BLUE") return "wt-chat-role-blue";
    if (role === "RED") return "wt-chat-role-red";
    return "wt-chat-role-host";
  }

  function roleDot(role: string) {
    if (role === "BLUE") return <span className="wt-chat-dot wt-chat-dot--blue" />;
    if (role === "RED") return <span className="wt-chat-dot wt-chat-dot--red" />;
    return <Crown size={10} className="wt-chat-host-icon" />;
  }

  return (
    <div className={`wt-chat-box ${className}`}>
      <div className="wt-chat-head">
        <span className="wt-chat-head-title">Chat</span>
        <span className="wt-chat-head-count">{messages.length} tin</span>
      </div>

      <div className="wt-chat-body">
        {loading ? (
          <div className="wt-chat-loading">
            <Loader2 size={16} className="animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="wt-chat-empty">Chưa có tin nhắn nào.</p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender === userName;
            return (
              <div key={msg.id} className={`wt-chat-row ${isOwn ? "is-own" : ""}`}>
                <div className="wt-chat-meta">
                  {roleDot(msg.role)}
                  <span className={`wt-chat-sender ${roleColor(msg.role)}`}>{msg.sender}</span>
                  {isOwn && <span className="wt-chat-you">(bạn)</span>}
                </div>
                <div className={`wt-chat-bubble ${isOwn ? "is-own" : ""}`}>
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="wt-chat-form" onSubmit={sendMessage}>
        {error && <p className="wt-chat-error">{error}</p>}
        <div className="wt-chat-input-row">
          <input
            ref={inputRef}
            className="wt-chat-input"
            placeholder="Nhập tin nhắn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!userName || sending}
            maxLength={MAX_CHAT_MESSAGE_LENGTH}
          />
          <button
            type="submit"
            disabled={!input.trim() || !userName || sending}
            className="wt-chat-send"
            onClick={() => playClickSound()}
            aria-label="Gửi"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </form>
    </div>
  );
}
