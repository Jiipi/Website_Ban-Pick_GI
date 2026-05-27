"use client";

import { CharacterCard } from "./CharacterCard";
import { PICKS_PER_TEAM } from "@/lib/constants";
import type { DraftEntry } from "@/lib/draft";
import type { GenshinCharacter } from "@/lib/genshin";

type PickGridProps = {
  accent: "blue" | "red";
  entries: DraftEntry[];
  characterMap: Map<string, GenshinCharacter>;
  isActive: boolean;
  previewCharacterIds?: string[];
};

export function PickGrid({ accent, entries, characterMap, isActive, previewCharacterIds }: PickGridProps) {
  return (
    <div className={`draft-pick-panel draft-pick-${accent} ${isActive ? "is-active" : ""}`}>
      <div className="draft-pick-grid">
        {Array.from({ length: PICKS_PER_TEAM }).map((_, index) => {
          const entry = entries[index];
          const isSkipped = entry?.characterId === "SKIPPED";
          const character = entry && !isSkipped ? characterMap.get(entry.characterId) : null;

          // SKIPPED slot — show empty with MISS
          if (isSkipped) {
            return (
              <div key={`${accent}-miss-${index}`} className="draft-card draft-card-pick draft-card-miss">
                <span className="draft-miss-label">MISS</span>
              </div>
            );
          }

          // Preview: show preview character in the next empty slot(s)
          const isEmptySlot = !entry && index >= entries.length;
          const previewIndex = index - entries.length;
          const previewCharId =
            isEmptySlot && previewCharacterIds && previewIndex >= 0 && previewIndex < previewCharacterIds.length
              ? previewCharacterIds[previewIndex]
              : null;
          const previewChar = previewCharId ? characterMap.get(previewCharId) : null;

          // If this slot has a preview character, render it as preview
          if (previewChar && !entry) {
            return (
              <CharacterCard
                key={`${accent}-preview-${index}`}
                id={previewChar.id}
                name={previewChar.name}
                element={previewChar.element}
                rarity={previewChar.rarity}
                sideIconUrl={previewChar.sideIconUrl}
                iconUrl={previewChar.iconUrl}
                chibiIconUrl={previewChar.chibiIconUrl}
                variant="pick-slot"
                accent={accent}
                isPreview={true}
              />
            );
          }

          return (
            <CharacterCard
              key={entry?.characterId ?? `${accent}-pick-${index}`}
              id={character?.id}
              name={character?.name}
              element={character?.element}
              rarity={character?.rarity}
              sideIconUrl={character?.sideIconUrl}
              iconUrl={character?.iconUrl}
              chibiIconUrl={character?.chibiIconUrl}
              variant="pick-slot"
              accent={accent}
              activeSlot={isActive && !entry && index === entries.length}
              badge={entry ? `P${entry.turnNumber}` : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
