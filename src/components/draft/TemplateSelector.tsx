"use client";

import { useState } from "react";
import { getAllTemplates, type DraftTemplate } from "@/domain/draft/DraftTemplate";

type TemplateSelectorProps = {
  roomCode: string;
  clientId: string;
  onApply?: (template: DraftTemplate) => void;
};

export function TemplateSelector({ roomCode, clientId, onApply }: TemplateSelectorProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const templates = getAllTemplates();

  async function handleSelect(template: DraftTemplate) {
    setLoading(template.id);
    try {
      const res = await fetch(`/api/room/${roomCode}/host`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_DRAFT_TEMPLATE",
          clientId,
          templateId: template.id,
        }),
      });
      if (res.ok) {
        onApply?.(template);
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="template-selector">
      <div className="template-header">
        <span>📋</span>
        <span>Draft Template</span>
      </div>
      <div className="template-cards">
        {templates.map((t) => (
          <button
            key={t.id}
            className="template-card"
            onClick={() => handleSelect(t)}
            disabled={loading !== null}
            type="button"
          >
            <span className="template-card-name">{t.name}</span>
            <span className="template-card-desc">{t.description}</span>
            <div className="template-card-meta">
              {t.bansPerTeam > 0 && <span>{t.bansPerTeam * 2} bans</span>}
              <span>{t.picksPerTeam * 2} picks</span>
              <span>{t.turns.length} turns</span>
            </div>
            <div className="template-turn-preview">
              {t.turns.slice(0, 12).map((turn, i) => (
                <span
                  key={i}
                  className={`template-turn-dot ${turn.player === "BLUE" ? "is-blue" : "is-red"} ${turn.action === "BAN" ? "is-ban" : "is-pick"}`}
                  title={`${turn.player} ${turn.action}`}
                />
              ))}
              {t.turns.length > 12 && <span className="template-turn-more">+{t.turns.length - 12}</span>}
            </div>
            {loading === t.id && (
              <div className="template-card-loading">Applying...</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
