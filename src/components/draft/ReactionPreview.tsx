"use client";

import { useMemo } from "react";
import { getReactionsForCandidate, type Reaction, type ReactionTier } from "@/lib/reactionGraph";
import { getCharacterElement, type CharacterElement } from "@/lib/genshin";

type ReactionPreviewProps = {
  candidateElement: CharacterElement;
  teamCharacterIds: string[];
};

const TIER_CLASSES: Record<ReactionTier, string> = {
  S: "reaction-chip-s",
  A: "reaction-chip-a",
  B: "reaction-chip-b",
};

export function ReactionPreview({ candidateElement, teamCharacterIds }: ReactionPreviewProps) {
  const reactions = useMemo(() => {
    if (teamCharacterIds.length === 0) return [];
    const teamElements = new Set(teamCharacterIds.map((id) => getCharacterElement(id)));
    return getReactionsForCandidate(candidateElement, teamElements);
  }, [candidateElement, teamCharacterIds]);

  if (reactions.length === 0) return null;

  return (
    <div className="reaction-preview-panel">
      <span className="reaction-preview-label">Reactions</span>
      <div className="reaction-chips">
        {reactions.map((r) => (
          <ReactionChip key={r.name} reaction={r} />
        ))}
      </div>
    </div>
  );
}

function ReactionChip({ reaction }: { reaction: Reaction }) {
  return (
    <span
      className={`reaction-chip ${TIER_CLASSES[reaction.tier]}`}
      style={{ "--reaction-color": reaction.color } as React.CSSProperties}
      title={reaction.description}
    >
      <span className="reaction-chip-icon">{reaction.icon}</span>
      <span className="reaction-chip-name">{reaction.name}</span>
      <span className="reaction-chip-tier">{reaction.tier}</span>
    </span>
  );
}
