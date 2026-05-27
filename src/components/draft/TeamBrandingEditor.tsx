"use client";

import { useState } from "react";

type TeamBrandingEditorProps = {
  roomCode: string;
  clientId: string;
};

export function TeamBrandingEditor({ roomCode, clientId }: TeamBrandingEditorProps) {
  const [blueName, setBlueName] = useState("");
  const [blueLogo, setBlueLogo] = useState("");
  const [blueColor, setBlueColor] = useState("#3B82F6");
  const [redName, setRedName] = useState("");
  const [redLogo, setRedLogo] = useState("");
  const [redColor, setRedColor] = useState("#EF4444");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/room/${roomCode}/host`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_TEAM_BRANDING",
          clientId,
          blueTeamName: blueName || undefined,
          blueTeamLogo: blueLogo || undefined,
          blueTeamColor: blueColor || undefined,
          redTeamName: redName || undefined,
          redTeamLogo: redLogo || undefined,
          redTeamColor: redColor || undefined,
        }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="branding-editor">
      <div className="branding-header">
        <span>🏷️</span>
        <span>Team Branding</span>
      </div>
      <div className="branding-grid">
        {/* Blue team */}
        <div className="branding-team branding-team-blue">
          <div className="branding-team-label">🔵 Blue</div>
          <input
            className="branding-input"
            placeholder="Tên đội (VD: T1)"
            value={blueName}
            onChange={(e) => setBlueName(e.target.value)}
            maxLength={30}
          />
          <input
            className="branding-input"
            placeholder="URL logo (optional)"
            value={blueLogo}
            onChange={(e) => setBlueLogo(e.target.value)}
            maxLength={500}
          />
          <div className="branding-color-row">
            <input
              type="color"
              value={blueColor}
              onChange={(e) => setBlueColor(e.target.value)}
              className="branding-color-input"
            />
            <span className="branding-color-hex">{blueColor}</span>
          </div>
        </div>

        {/* Red team */}
        <div className="branding-team branding-team-red">
          <div className="branding-team-label">🔴 Red</div>
          <input
            className="branding-input"
            placeholder="Tên đội (VD: DRX)"
            value={redName}
            onChange={(e) => setRedName(e.target.value)}
            maxLength={30}
          />
          <input
            className="branding-input"
            placeholder="URL logo (optional)"
            value={redLogo}
            onChange={(e) => setRedLogo(e.target.value)}
            maxLength={500}
          />
          <div className="branding-color-row">
            <input
              type="color"
              value={redColor}
              onChange={(e) => setRedColor(e.target.value)}
              className="branding-color-input"
            />
            <span className="branding-color-hex">{redColor}</span>
          </div>
        </div>
      </div>
      <button
        className="constraint-save-btn"
        onClick={handleSave}
        disabled={saving}
        type="button"
      >
        {saving ? "Đang lưu..." : saved ? "✓ Đã lưu" : "💾 Save Branding"}
      </button>
    </div>
  );
}
