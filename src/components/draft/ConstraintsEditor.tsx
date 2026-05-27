"use client";

import { useState, useCallback } from "react";
import { Settings2, Shield, Swords, Ban } from "lucide-react";
import {
  type TournamentConstraints,
  getDefaultConstraints,
  getConstraintSummary,
} from "@/domain/tournament/TournamentConstraints";
import { playClickSound } from "@/lib/sounds";

type ConstraintsEditorProps = {
  roomCode: string;
  clientId: string;
  constraints: TournamentConstraints | null;
  onSaved: (constraints: TournamentConstraints) => void;
  readOnly?: boolean;
};

export function ConstraintsEditor({
  roomCode,
  clientId,
  constraints: initial,
  onSaved,
  readOnly = false,
}: ConstraintsEditorProps) {
  const [constraints, setConstraints] = useState<TournamentConstraints>(
    initial ?? getDefaultConstraints()
  );
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const summary = getConstraintSummary(constraints);
  const hasChanges = JSON.stringify(constraints) !== JSON.stringify(initial ?? getDefaultConstraints());

  const handleSave = useCallback(async () => {
    if (saving || readOnly) return;
    setSaving(true);
    playClickSound();

    try {
      const res = await fetch(`/api/room/${roomCode}/host`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          action: "SET_CONSTRAINTS",
          constraints,
        }),
      });
      if (res.ok) {
        onSaved(constraints);
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }, [roomCode, clientId, constraints, saving, readOnly, onSaved]);

  return (
    <div className="constraints-editor">
      <button
        type="button"
        className="constraints-header"
        onClick={() => { setExpanded(!expanded); playClickSound(); }}
      >
        <div className="constraints-header-left">
          <Settings2 size={14} />
          <span className="constraints-title">Tournament Rules</span>
        </div>
        <span className="constraints-summary">{summary}</span>
        <span className={`constraints-chevron ${expanded ? "is-open" : ""}`}>▾</span>
      </button>

      {expanded && (
        <div className="constraints-body">
          {constraints.customLabel && (
            <div className="constraints-label-badge">{constraints.customLabel}</div>
          )}

          {/* Constellation Limit */}
          <div className="constraint-row">
            <label className="constraint-label">
              <Swords size={12} />
              Max Constellation
            </label>
            <div className="constraint-control">
              <input
                type="range"
                min={0}
                max={6}
                value={constraints.maxConstellation}
                onChange={(e) => setConstraints({ ...constraints, maxConstellation: Number(e.target.value) })}
                disabled={readOnly}
                className="constraint-slider"
              />
              <span className="constraint-value">C{constraints.maxConstellation}</span>
            </div>
          </div>

          {/* Weapon Refinement Limit */}
          <div className="constraint-row">
            <label className="constraint-label">
              <Shield size={12} />
              Max Refinement
            </label>
            <div className="constraint-control">
              <input
                type="range"
                min={1}
                max={5}
                value={constraints.maxWeaponRefinement}
                onChange={(e) => setConstraints({ ...constraints, maxWeaponRefinement: Number(e.target.value) })}
                disabled={readOnly}
                className="constraint-slider"
              />
              <span className="constraint-value">R{constraints.maxWeaponRefinement}</span>
            </div>
          </div>

          {/* F2P Weapon Toggle */}
          <div className="constraint-row">
            <label className="constraint-label">
              <Ban size={12} />
              F2P Weapons Only (4★)
            </label>
            <div className="constraint-control">
              <button
                type="button"
                className={`constraint-toggle ${constraints.forceF2PWeapon ? "is-on" : ""}`}
                onClick={() => !readOnly && setConstraints({
                  ...constraints,
                  forceF2PWeapon: !constraints.forceF2PWeapon,
                  weaponRarityLimit: !constraints.forceF2PWeapon ? 4 : 5,
                })}
                disabled={readOnly}
              >
                {constraints.forceF2PWeapon ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          {/* Custom Label */}
          <div className="constraint-row">
            <label className="constraint-label">Label</label>
            <input
              type="text"
              className="constraint-text-input"
              placeholder="e.g. C2R1 Standard"
              maxLength={60}
              value={constraints.customLabel}
              onChange={(e) => setConstraints({ ...constraints, customLabel: e.target.value })}
              disabled={readOnly}
            />
          </div>

          {/* Save button */}
          {!readOnly && hasChanges && (
            <button
              type="button"
              className="constraint-save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "💾 Save Rules"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
