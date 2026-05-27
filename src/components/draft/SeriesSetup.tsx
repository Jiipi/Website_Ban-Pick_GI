"use client";

import { useState } from "react";

type SeriesSetupProps = {
  roomCode: string;
  clientId: string;
  currentFormat: string | null;
  currentFearless: boolean;
  onApply?: (format: string, fearless: boolean) => void;
};

const FORMATS = [
  { id: "BO1", label: "Bo1", desc: "Single game", wins: 1 },
  { id: "BO3", label: "Bo3", desc: "First to 2 wins", wins: 2 },
  { id: "BO5", label: "Bo5", desc: "First to 3 wins", wins: 3 },
  { id: "BO7", label: "Bo7", desc: "First to 4 wins", wins: 4 },
];

export function SeriesSetup({
  roomCode,
  clientId,
  currentFormat,
  currentFearless,
  onApply,
}: SeriesSetupProps) {
  const [selectedFormat, setSelectedFormat] = useState(currentFormat ?? "BO1");
  const [fearless, setFearless] = useState(currentFearless);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/room/${roomCode}/host`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_SERIES_FORMAT",
          clientId,
          format: selectedFormat,
          fearless,
        }),
      });
      if (res.ok) {
        onApply?.(selectedFormat, fearless);
      }
    } finally {
      setSaving(false);
    }
  }

  const changed = selectedFormat !== (currentFormat ?? "BO1") || fearless !== currentFearless;

  return (
    <div className="series-setup">
      <div className="series-setup-header">
        <span>🏆</span>
        <span>Series Format</span>
      </div>
      <div className="series-format-grid">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            className={`series-format-btn ${selectedFormat === f.id ? "is-active" : ""}`}
            onClick={() => setSelectedFormat(f.id)}
            type="button"
          >
            <span className="series-format-label">{f.label}</span>
            <span className="series-format-desc">{f.desc}</span>
          </button>
        ))}
      </div>
      {selectedFormat !== "BO1" && (
        <div className="series-options">
          <label className="series-fearless-toggle">
            <button
              className={`constraint-toggle ${fearless ? "is-on" : ""}`}
              onClick={() => setFearless(!fearless)}
              type="button"
            >
              {fearless ? "ON" : "OFF"}
            </button>
            <span className="series-fearless-label">
              🚫 Fearless Draft — tướng đã pick game trước bị cấm game sau
            </span>
          </label>
        </div>
      )}
      {changed && (
        <button
          className="constraint-save-btn"
          onClick={handleSave}
          disabled={saving}
          type="button"
        >
          {saving ? "Đang lưu..." : "💾 Save Format"}
        </button>
      )}
    </div>
  );
}
