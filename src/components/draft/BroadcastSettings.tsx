"use client";

import { useState } from "react";

type BroadcastSettingsProps = {
  roomCode: string;
  clientId: string;
  currentDelay: number;
  casterIds: string[];
};

export function BroadcastSettings({
  roomCode,
  clientId,
  currentDelay,
  casterIds,
}: BroadcastSettingsProps) {
  const [delay, setDelay] = useState(currentDelay);
  const [newCaster, setNewCaster] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSetDelay(d: number) {
    setDelay(d);
    setSaving(true);
    try {
      await fetch(`/api/room/${roomCode}/host`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SET_SPECTATOR_DELAY", clientId, delay: d }),
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCaster() {
    if (!newCaster.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/room/${roomCode}/host`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ADD_CASTER", clientId, casterClientId: newCaster.trim() }),
      });
      if (res.ok) setNewCaster("");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveCaster(id: string) {
    setSaving(true);
    try {
      await fetch(`/api/room/${roomCode}/host`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REMOVE_CASTER", clientId, casterClientId: id }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="broadcast-settings">
      <div className="broadcast-header">
        <span>📡</span>
        <span>Broadcast Settings</span>
      </div>

      {/* Spectator Delay */}
      <div className="broadcast-section">
        <div className="broadcast-section-label">⏳ Spectator Delay</div>
        <div className="broadcast-delay-grid">
          {[0, 30, 60, 90].map((d) => (
            <button
              key={d}
              className={`broadcast-delay-btn ${delay === d ? "is-active" : ""}`}
              onClick={() => handleSetDelay(d)}
              disabled={saving}
              type="button"
            >
              {d === 0 ? "Off" : `${d}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Caster Management */}
      <div className="broadcast-section">
        <div className="broadcast-section-label">🎙️ Casters ({casterIds.length}/4)</div>
        <div className="broadcast-caster-list">
          {casterIds.map((id) => (
            <div key={id} className="broadcast-caster-chip">
              <span className="broadcast-caster-id">{id.slice(0, 8)}...</span>
              <button
                className="broadcast-caster-remove"
                onClick={() => handleRemoveCaster(id)}
                type="button"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="broadcast-caster-add">
          <input
            className="branding-input"
            placeholder="Client ID của caster"
            value={newCaster}
            onChange={(e) => setNewCaster(e.target.value)}
          />
          <button
            className="broadcast-add-btn"
            onClick={handleAddCaster}
            disabled={saving || !newCaster.trim() || casterIds.length >= 4}
            type="button"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Overlay URL */}
      <div className="broadcast-section">
        <div className="broadcast-section-label">🖥️ OBS Overlay URL</div>
        <div className="broadcast-overlay-url">
          <code>{typeof window !== "undefined" ? window.location.origin : ""}/overlay/{roomCode}</code>
          <button
            className="broadcast-copy-btn"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/overlay/${roomCode}`);
            }}
            type="button"
          >
            📋
          </button>
        </div>
        <p className="broadcast-hint">Dùng làm Browser Source 1920×1080 trong OBS</p>
      </div>
    </div>
  );
}
