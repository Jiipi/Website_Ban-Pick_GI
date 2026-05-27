"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Search, ChevronDown } from "lucide-react";
import { CharacterCard } from "./CharacterCard";
import { CharacterPreview } from "./draft/CharacterPreview";
import { ReactionPreview } from "./draft/ReactionPreview";
import { fuzzyFilter } from "@/lib/fuzzySearch";
import {
  ALL_ELEMENTS,
  ELEMENT_COLORS,
  ELEMENT_ICON_URLS,
  type CharacterElement,
  type GenshinCharacter,
} from "@/lib/genshin";
import {
  ALL_WEAPONS,
  ALL_REGIONS,
  WEAPON_ICONS,
  REGION_ICONS,
  getCharacterMeta,
  type WeaponType,
  type Region,
} from "@/lib/characterMeta";
import type { DraftEntry } from "@/lib/draft";
import type { TeamSide } from "@/lib/types";
import { playClickSound } from "@/lib/sounds";

type RarityFilter = "ALL" | 4 | 5;

type PoolColumnProps = {
  accent: "blue" | "red";
  characters: GenshinCharacter[];
  logs: DraftEntry[];
  selected: Set<string>;
  canAct: boolean;
  ownerSide: TeamSide;
  onToggle: (characterId: string) => void;
  teamPickIds?: string[];
};

export function PoolColumn({
  accent,
  characters,
  logs,
  selected,
  canAct,
  ownerSide,
  onToggle,
  teamPickIds = [],
}: PoolColumnProps) {
  const [search, setSearch] = useState("");
  const [elementFilter, setElementFilter] = useState<CharacterElement | "ALL">("ALL");
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>("ALL");
  const [weaponFilter, setWeaponFilter] = useState<WeaponType | "ALL">("ALL");
  const [regionFilter, setRegionFilter] = useState<Region | "ALL">("ALL");
  const [showExtraFilters, setShowExtraFilters] = useState(false);

  // Hover preview state
  const [hoveredCharacter, setHoveredCharacter] = useState<GenshinCharacter | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | undefined>(undefined);

  // Keyboard navigation state
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    // Apply fuzzy search first
    let results = fuzzyFilter(search, characters);

    // Then apply element, rarity, weapon, and region filters
    results = results.filter((character) => {
      if (elementFilter !== "ALL" && character.element !== elementFilter) return false;
      if (rarityFilter !== "ALL" && character.rarity !== rarityFilter) return false;
      if (weaponFilter !== "ALL") {
        const meta = getCharacterMeta(character.id);
        if (meta.weapon !== weaponFilter) return false;
      }
      if (regionFilter !== "ALL") {
        const meta = getCharacterMeta(character.id);
        if (meta.region !== regionFilter) return false;
      }
      return true;
    });

    return results;
  }, [characters, elementFilter, rarityFilter, weaponFilter, regionFilter, search]);

  // Reset highlight when filtered results change
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setHighlightIndex(-1);
    });
    return () => {
      cancelled = true;
    };
  }, [filtered.length, search]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      switch (event.key) {
        case "ArrowDown": {
          event.preventDefault();
          setHighlightIndex((prev) =>
            prev < filtered.length - 1 ? prev + 1 : 0
          );
          break;
        }
        case "ArrowUp": {
          event.preventDefault();
          setHighlightIndex((prev) =>
            prev > 0 ? prev - 1 : filtered.length - 1
          );
          break;
        }
        case "Enter": {
          event.preventDefault();
          if (highlightIndex >= 0 && highlightIndex < filtered.length) {
            const char = filtered[highlightIndex];
            const log = logs.find((entry) => entry.characterId === char.id);
            if (!log && canAct) {
              onToggle(char.id);
            }
          }
          break;
        }
        case "Escape": {
          event.preventDefault();
          setSearch("");
          setHighlightIndex(-1);
          searchInputRef.current?.blur();
          break;
        }
      }
    },
    [filtered, highlightIndex, logs, canAct, onToggle]
  );

  // Scroll highlighted card into view
  useEffect(() => {
    if (highlightIndex < 0 || !gridRef.current) return;
    const cards = gridRef.current.querySelectorAll("[data-pool-card]");
    const card = cards[highlightIndex] as HTMLElement | undefined;
    card?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlightIndex]);

  // Hover handlers
  const handleMouseEnter = useCallback(
    (character: GenshinCharacter, event: React.MouseEvent) => {
      setHoveredCharacter(character);
      setHoverPos({ x: event.clientX, y: event.clientY });
    },
    []
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (hoveredCharacter) {
        setHoverPos({ x: event.clientX, y: event.clientY });
      }
    },
    [hoveredCharacter]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredCharacter(null);
    setHoverPos(undefined);
  }, []);

  return (
    <section className={`draft-pool-panel draft-pool-panel-${accent}`}>
      <div className="draft-pool-toolbar">
        <label className="draft-search-wrap">
          <Search className="draft-search-icon" size={15} aria-hidden="true" />
          <input
            ref={searchInputRef}
            className="draft-search-input"
            placeholder="Search character..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Search characters"
          />
        </label>

        <div className="draft-filter-row" role="group" aria-label="Element and rarity filters">
          <div className="draft-element-filter" aria-label="Element filter">
            <FilterButton
              active={elementFilter === "ALL"}
              title="All elements"
              className="draft-filter-button-all"
              onClick={() => setElementFilter("ALL")}
            >
              All
            </FilterButton>
            {ALL_ELEMENTS.map((element) => (
              <FilterButton
                key={element}
                active={elementFilter === element}
                color={ELEMENT_COLORS[element]}
                title={element}
                className="draft-element-button"
                onClick={() => setElementFilter(element)}
              >
                <ElementFilterIcon element={element} />
              </FilterButton>
            ))}
          </div>

          <div className="draft-rarity-filter" aria-label="Rarity filter">
            <FilterButton
              active={rarityFilter === "ALL"}
              title="All rarities"
              className="draft-rarity-button"
              onClick={() => setRarityFilter("ALL")}
            >
              All
            </FilterButton>
            <FilterButton
              active={rarityFilter === 5}
              color="#f0b35a"
              title="5 star"
              className="draft-rarity-button"
              onClick={() => setRarityFilter(5)}
            >
              5*
            </FilterButton>
            <FilterButton
              active={rarityFilter === 4}
              color="#a98ce4"
              title="4 star"
              className="draft-rarity-button"
              onClick={() => setRarityFilter(4)}
            >
              4*
            </FilterButton>
            <span className="draft-pool-count">{filtered.length}</span>
          </div>
        </div>

        {/* Toggle button for extra filters */}
        <button
          type="button"
          className="draft-filter-toggle-btn"
          onClick={() => {
            setShowExtraFilters((v) => !v);
            playClickSound();
          }}
          aria-expanded={showExtraFilters}
        >
          Weapon / Region
          <ChevronDown
            size={12}
            className={`chevron ${showExtraFilters ? "is-rotated" : ""}`}
          />
        </button>

        {/* Collapsible weapon & region filters */}
        <div className={`draft-filter-section ${showExtraFilters ? "is-expanded" : "is-collapsed"}`}>
          <div className="draft-extra-filters">
            {/* Weapon filter */}
            <div className="draft-weapon-filter" role="group" aria-label="Weapon filter">
              <span className="draft-filter-section-label">Weapon</span>
              <FilterChip
                active={weaponFilter === "ALL"}
                label="All"
                onClick={() => setWeaponFilter("ALL")}
              />
              {ALL_WEAPONS.map((weapon) => (
                <FilterChip
                  key={weapon}
                  active={weaponFilter === weapon}
                  label={weapon}
                  emoji={WEAPON_ICONS[weapon]}
                  onClick={() => setWeaponFilter(weapon)}
                />
              ))}
            </div>

            {/* Region filter */}
            <div className="draft-region-filter" role="group" aria-label="Region filter">
              <span className="draft-filter-section-label">Region</span>
              <FilterChip
                active={regionFilter === "ALL"}
                label="All"
                onClick={() => setRegionFilter("ALL")}
              />
              {ALL_REGIONS.map((region) => (
                <FilterChip
                  key={region}
                  active={regionFilter === region}
                  label={region}
                  emoji={REGION_ICONS[region]}
                  onClick={() => setRegionFilter(region)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="draft-character-grid" ref={gridRef}>
        {filtered.map((character, index) => {
          const log = logs.find((entry) => entry.characterId === character.id);
          const badge = log ? (log.action === "BAN" ? "BAN" : "PICK") : undefined;
          const isHighlighted = index === highlightIndex;

          return (
            <div
              key={character.id}
              data-pool-card
              className={`draft-pool-card-wrapper ${isHighlighted ? "draft-keyboard-highlight" : ""}`}
              onMouseEnter={(e) => handleMouseEnter(character, e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <CharacterCard
                id={character.id}
                name={character.name}
                element={character.element}
                rarity={character.rarity}
                sideIconUrl={character.sideIconUrl}
                iconUrl={character.iconUrl}
                chibiIconUrl={character.chibiIconUrl}
                disabled={Boolean(log) || !canAct}
                selected={selected.has(character.id)}
                badge={badge}
                variant="pool"
                accent={
                  selected.has(character.id)
                    ? "neutral"
                    : log?.player === "BLUE"
                      ? "blue"
                      : log?.player === "RED"
                        ? "red"
                        : "neutral"
                }
                onClick={() => onToggle(character.id)}
              />
            </div>
          );
        })}
      </div>

      {/* Hover preview panel */}
      <CharacterPreview character={hoveredCharacter} position={hoverPos} />
      {hoveredCharacter && teamPickIds.length > 0 && (
        <ReactionPreview
          candidateElement={hoveredCharacter.element}
          teamCharacterIds={teamPickIds}
        />
      )}
    </section>
  );
}

/* ── Filter Chip (weapon/region) ── */
function FilterChip({
  active,
  label,
  emoji,
  onClick,
}: {
  active: boolean;
  label: string;
  emoji?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`draft-filter-chip ${active ? "is-active" : ""}`}
      style={
        active
          ? ({ "--chip-color": "rgba(200, 215, 240, 0.6)" } as CSSProperties)
          : undefined
      }
      onClick={() => {
        onClick();
        playClickSound();
      }}
      aria-pressed={active}
    >
      {emoji && <span className="draft-filter-chip-emoji">{emoji}</span>}
      {label}
    </button>
  );
}

function FilterButton({
  active,
  children,
  className = "",
  color,
  title,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  className?: string;
  color?: string;
  title?: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`draft-filter-button ${className} ${active ? "is-active" : ""}`}
      style={
        color
          ? {
              "--filter-color": color,
            } as CSSProperties
          : undefined
      }
      title={title}
      type="button"
      aria-pressed={active}
      onClick={() => {
        onClick();
        playClickSound();
      }}
    >
      {children}
    </button>
  );
}

function ElementFilterIcon({ element }: { element: CharacterElement }) {
  const iconUrl = ELEMENT_ICON_URLS[element];

  if (!iconUrl) return <span>{element.slice(0, 2)}</span>;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="draft-element-icon" src={iconUrl} alt="" aria-hidden="true" />
  );
}
