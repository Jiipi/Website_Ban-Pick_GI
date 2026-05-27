import { CharacterCard } from "@/components/CharacterCard";
import type { DraftEntry } from "@/lib/draft";
import type { GenshinCharacter } from "@/lib/genshin";

type BanRowProps = {
  accent: "blue" | "red";
  entries: DraftEntry[];
  characterMap: Map<string, GenshinCharacter>;
  activeIndex: number;
  previewCharacterIds?: string[];
};

export function BanRow({ accent, entries, characterMap, activeIndex, previewCharacterIds }: BanRowProps) {
  return (
    <div className="draft-ban-row">
      {Array.from({ length: 3 }).map((_, index) => {
        const entry = entries[index];
        const isSkipped = entry?.characterId === "SKIPPED";
        const character = entry && !isSkipped ? characterMap.get(entry.characterId) : null;

        // SKIPPED ban slot — show empty with MISS
        if (isSkipped) {
          return (
            <div key={`${accent}-ban-miss-${index}`} className="draft-card draft-card-ban draft-card-miss">
              <span className="draft-miss-label">MISS</span>
            </div>
          );
        }

        // Preview: show preview character in the next empty ban slot
        const isEmptySlot = !entry && index >= entries.length;
        const previewIndex = index - entries.length;
        const previewCharId =
          isEmptySlot && previewCharacterIds && previewIndex >= 0 && previewIndex < previewCharacterIds.length
            ? previewCharacterIds[previewIndex]
            : null;
        const previewChar = previewCharId ? characterMap.get(previewCharId) : null;

        if (previewChar && !entry) {
          return (
            <CharacterCard
              key={`${accent}-ban-preview-${index}`}
              id={previewChar.id}
              name={previewChar.name}
              element={previewChar.element}
              rarity={previewChar.rarity}
              sideIconUrl={previewChar.sideIconUrl}
              iconUrl={previewChar.iconUrl}
              chibiIconUrl={previewChar.chibiIconUrl}
              variant="ban-slot"
              accent={accent}
              isPreview={true}
            />
          );
        }

        return (
          <CharacterCard
            key={entry?.characterId ?? `${accent}-ban-${index}`}
            id={character?.id}
            name={character?.name}
            element={character?.element}
            rarity={character?.rarity}
            sideIconUrl={character?.sideIconUrl}
            iconUrl={character?.iconUrl}
            chibiIconUrl={character?.chibiIconUrl}
            variant="ban-slot"
            accent={accent}
            activeSlot={activeIndex === index}
            badge={entry ? `B${entry.turnNumber}` : undefined}
          />
        );
      })}
    </div>
  );
}
