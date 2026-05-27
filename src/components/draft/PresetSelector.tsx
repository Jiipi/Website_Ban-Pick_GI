"use client";

import { useState, useCallback } from "react";
import { Zap } from "lucide-react";
import { getPresets, type CostPreset } from "@/lib/presets";
import { type TournamentConstraints } from "@/domain/tournament/TournamentConstraints";
import { playClickSound, playConfirmSound } from "@/lib/sounds";

type PresetSelectorProps = {
  roomCode: string;
  clientId: string;
  onApply: (preset: CostPreset) => void;
};

const presets = getPresets();

export function PresetSelector({ roomCode, clientId, onApply }: PresetSelectorProps) {
  const [applying, setApplying] = useState<string | null>(null);

  const handleApply = useCallback(async (preset: CostPreset) => {
    if (applying) return;
    setApplying(preset.id);
    playClickSound();

    try {
      // Apply constraints
      const res = await fetch(`/api/room/${roomCode}/host`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          action: "SET_CONSTRAINTS",
          constraints: preset.constraints,
        }),
      });

      if (res.ok) {
        playConfirmSound();
        onApply(preset);
      }
    } catch {
      // silently fail
    } finally {
      setApplying(null);
    }
  }, [roomCode, clientId, applying, onApply]);

  return (
    <div className="preset-selector">
      <div className="preset-header">
        <Zap size={13} />
        <span>Quick Presets</span>
      </div>
      <div className="preset-cards">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="preset-card"
            onClick={() => handleApply(preset)}
            disabled={applying !== null}
            title={preset.description}
          >
            <span className="preset-card-name">{preset.name}</span>
            <span className="preset-card-desc">{preset.description}</span>
            <span className="preset-card-meta">
              C{preset.constraints.maxConstellation} · R{preset.constraints.maxWeaponRefinement}
              {preset.constraints.forceF2PWeapon ? " · F2P" : ""}
            </span>
            {applying === preset.id && <span className="preset-card-loading">Applying...</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
