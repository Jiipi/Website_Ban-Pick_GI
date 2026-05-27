"use client";

import { useState } from "react";

type WebhookSettingsProps = {
  roomCode: string;
  clientId: string;
  currentUrl?: string | null;
};

export function WebhookSettings({ roomCode, clientId, currentUrl }: WebhookSettingsProps) {
  const [url, setUrl] = useState(currentUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/room/${roomCode}/host`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_DISCORD_WEBHOOK",
          clientId,
          webhookUrl: url,
        }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!url.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title: "✅ Webhook Test — Genshin Ban/Pick",
              description: `Room **${roomCode}** đã kết nối thành công!`,
              color: 0x22c55e,
              footer: { text: "Genshin Ban/Pick" },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
      setTestResult(res.ok ? "ok" : "fail");
    } catch {
      setTestResult("fail");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="webhook-settings">
      <div className="webhook-header">
        <span>🔔</span>
        <span>Discord Webhook</span>
      </div>
      <p className="webhook-hint">
        Tự động post room code, start/end draft, result card vào Discord server.
      </p>
      <div className="webhook-input-row">
        <input
          className="branding-input"
          placeholder="https://discord.com/api/webhooks/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <div className="webhook-actions">
        <button
          className="broadcast-add-btn"
          onClick={handleTest}
          disabled={testing || !url.trim()}
          type="button"
        >
          {testing ? "..." : "🧪 Test"}
        </button>
        <button
          className="constraint-save-btn"
          onClick={handleSave}
          disabled={saving}
          type="button"
        >
          {saving ? "..." : saved ? "✓ Saved" : "💾 Save"}
        </button>
      </div>
      {testResult === "ok" && (
        <p className="webhook-result webhook-result-ok">✅ Webhook hoạt động!</p>
      )}
      {testResult === "fail" && (
        <p className="webhook-result webhook-result-fail">❌ Gửi thất bại. Kiểm tra URL.</p>
      )}
    </div>
  );
}
