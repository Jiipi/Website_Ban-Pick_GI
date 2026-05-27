"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ELEMENT_COLORS,
  ELEMENT_ICON_URLS,
  ELEMENT_ICONS,
  type CharacterElement,
  type GenshinCharacter,
} from "@/lib/genshin";
import {
  getCharacterMeta,
  WEAPON_ICONS,
  REGION_ICONS,
  type CharacterMeta,
} from "@/lib/characterMeta";

type CharacterPreviewProps = {
  character: GenshinCharacter | null;
  position?: { x: number; y: number };
};

const PANEL_WIDTH = 300;
const PANEL_ESTIMATED_HEIGHT = 380;
const VIEWPORT_PADDING = 12;

export function CharacterPreview({ character, position }: CharacterPreviewProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [clampedPos, setClampedPos] = useState<{ left: number; top: number } | null>(null);
  const [visible, setVisible] = useState(false);

  // Compute clamped position when character or cursor position changes
  useEffect(() => {
    let cancelled = false;

    if (!character || !position) {
      queueMicrotask(() => {
        if (cancelled) return;
        setVisible(false);
        setClampedPos(null);
      });
      return () => {
        cancelled = true;
      };
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const panelH = panelRef.current?.offsetHeight ?? PANEL_ESTIMATED_HEIGHT;

    let left = position.x + 16;
    let top = position.y - 20;

    // Flip to left side if overflows right
    if (left + PANEL_WIDTH + VIEWPORT_PADDING > vw) {
      left = position.x - PANEL_WIDTH - 16;
    }
    // Clamp left
    left = Math.max(VIEWPORT_PADDING, Math.min(left, vw - PANEL_WIDTH - VIEWPORT_PADDING));
    // Clamp top
    top = Math.max(VIEWPORT_PADDING, Math.min(top, vh - panelH - VIEWPORT_PADDING));

    queueMicrotask(() => {
      if (cancelled) return;
      setClampedPos({ left, top });
      requestAnimationFrame(() => {
        if (!cancelled) setVisible(true);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [character, position]);

  if (!character) return null;

  const meta: CharacterMeta = getCharacterMeta(character.id);
  const elementColor = ELEMENT_COLORS[character.element];
  const elementIconUrl = ELEMENT_ICON_URLS[character.element];
  const elementEmoji = ELEMENT_ICONS[character.element];
  const weaponEmoji = WEAPON_ICONS[meta.weapon];
  const regionEmoji = REGION_ICONS[meta.region];

  return (
    <div
      ref={panelRef}
      className={`character-preview-panel ${visible ? "is-visible" : ""}`}
      style={{
        position: "fixed",
        left: clampedPos?.left ?? -9999,
        top: clampedPos?.top ?? -9999,
        width: PANEL_WIDTH,
        zIndex: 100,
        "--preview-element-color": elementColor,
      } as React.CSSProperties}
      aria-hidden="true"
    >
      {/* Splash art with gradient overlay */}
      <div className="character-preview-image">
        <Image
          src={character.iconUrl}
          alt={character.name}
          width={PANEL_WIDTH}
          height={200}
          className="character-preview-splash"
          unoptimized
          priority
        />
        <div
          className="character-preview-gradient"
          style={{
            background: `linear-gradient(180deg, transparent 30%, ${elementColor}22 60%, rgba(8,12,28,0.95) 100%)`,
          }}
        />
      </div>

      {/* Info section */}
      <div className="character-preview-info">
        <h3 className="character-preview-name">{character.name}</h3>

        <div className="character-preview-meta-row">
          {/* Element */}
          <span
            className="character-preview-meta-chip"
            style={{ borderColor: `${elementColor}66`, background: `${elementColor}18` }}
          >
            {elementIconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={elementIconUrl}
                alt=""
                aria-hidden="true"
                className="character-preview-meta-icon"
              />
            ) : (
              <span className="character-preview-meta-emoji">{elementEmoji}</span>
            )}
            <span style={{ color: elementColor }}>{character.element}</span>
          </span>

          {/* Weapon */}
          <span className="character-preview-meta-chip">
            <span className="character-preview-meta-emoji">{weaponEmoji}</span>
            <span>{meta.weapon}</span>
          </span>

          {/* Region */}
          <span className="character-preview-meta-chip">
            <span className="character-preview-meta-emoji">{regionEmoji}</span>
            <span>{meta.region}</span>
          </span>
        </div>

        {/* Rarity */}
        <div className="character-preview-rarity">
          {Array.from({ length: character.rarity }, (_, i) => (
            <span key={i} className="character-preview-star">★</span>
          ))}
        </div>

        {/* Role tags */}
        <div className="character-preview-tags">
          {meta.roles.map((role) => (
            <span
              key={role}
              className="character-preview-tag"
              style={{ borderColor: `${elementColor}44`, color: elementColor }}
            >
              {role}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
