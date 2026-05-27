"use client";

import { useMemo } from "react";
import { analyzeTeamComp } from "@/lib/teamCompAnalysis";
import { ELEMENT_COLORS, ELEMENT_ICON_URLS, type CharacterElement } from "@/lib/genshin";

type TeamCompPanelProps = {
  characterIds: string[];
  team: "BLUE" | "RED";
};

const ROLE_ICONS: Record<string, string> = {
  "Main DPS": "⚔️",
  "Sub DPS": "🎯",
  "Support": "🔄",
  "Healer": "💊",
  "Shielder": "🛡️",
};

const SEVERITY_CLASSES: Record<string, string> = {
  error: "comp-warn-error",
  warning: "comp-warn-warning",
  info: "comp-warn-info",
};

export function TeamCompPanel({ characterIds, team }: TeamCompPanelProps) {
  const result = useMemo(() => analyzeTeamComp(characterIds), [characterIds]);

  if (characterIds.length === 0) return null;

  const teamClass = team === "BLUE" ? "comp-panel-blue" : "comp-panel-red";

  return (
    <div className={`team-comp-panel ${teamClass}`}>
      {/* Element breakdown */}
      <div className="comp-elements">
        {result.elements.map(({ element, count }) => (
          <ElementBubble key={element} element={element} count={count} />
        ))}
      </div>

      {/* Role breakdown */}
      {result.roles.length > 0 && (
        <div className="comp-roles">
          {result.roles.map(({ role, count }) => (
            <span key={role} className="comp-role-tag" title={role}>
              {ROLE_ICONS[role] ?? "❓"} {count}
            </span>
          ))}
        </div>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="comp-warnings">
          {result.warnings.map((w) => (
            <div key={w.type} className={`comp-warning ${SEVERITY_CLASSES[w.severity]}`}>
              <span className="comp-warning-icon">{w.icon}</span>
              <span className="comp-warning-text">{w.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ElementBubble({ element, count }: { element: CharacterElement; count: number }) {
  const iconUrl = ELEMENT_ICON_URLS[element];
  const color = ELEMENT_COLORS[element];

  return (
    <span
      className="comp-element-bubble"
      style={{ borderColor: `${color}55`, background: `${color}18` }}
      title={`${element} ×${count}`}
    >
      {iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={iconUrl} alt="" className="comp-element-icon" aria-hidden="true" />
      ) : (
        <span style={{ color }}>{element.slice(0, 2)}</span>
      )}
      <span className="comp-element-count" style={{ color }}>×{count}</span>
    </span>
  );
}
