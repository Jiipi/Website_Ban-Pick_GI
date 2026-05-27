import Image from "next/image";
import type { CSSProperties } from "react";
import {
  ELEMENT_COLORS,
  ELEMENT_ICON_URLS,
  getCharacterElement,
  type CharacterElement,
} from "@/lib/genshin";
import { getCharacterMeta, WEAPON_ICONS } from "@/lib/characterMeta";

type CharacterCardProps = {
  id?: string;
  name?: string;
  disabled?: boolean;
  selected?: boolean;
  badge?: string;
  onClick?: () => void;
  variant?: "pool" | "pick-slot" | "ban-slot" | "mini-slot";
  accent?: "blue" | "red" | "neutral";
  placeholder?: string;
  element?: CharacterElement;
  rarity?: 4 | 5;
  sideIconUrl?: string;
  iconUrl?: string;
  chibiIconUrl?: string;
  activeSlot?: boolean;
  isPreview?: boolean;
};

export function CharacterCard({
  id,
  name,
  disabled,
  selected,
  badge,
  onClick,
  variant = "pool",
  accent = "neutral",
  placeholder,
  element,
  rarity,
  chibiIconUrl,
  activeSlot,
  isPreview,
}: CharacterCardProps) {
  if (!id || !name) {
    return (
      <EmptySlot
        variant={variant}
        accent={accent}
        placeholder={placeholder}
        active={activeSlot}
      />
    );
  }

  const resolvedElement = element ?? getCharacterElement(id);
  const elementColor = ELEMENT_COLORS[resolvedElement];
  const chibiUrl = chibiIconUrl ?? `/api/chibi?name=${encodeURIComponent(name)}`;

  const rarityBg =
    rarity === 5
      ? "linear-gradient(180deg, rgba(204, 133, 56, 0.78) 0%, rgba(82, 58, 40, 0.9) 100%)"
      : rarity === 4
        ? "linear-gradient(180deg, rgba(122, 94, 166, 0.78) 0%, rgba(53, 43, 88, 0.9) 100%)"
        : `linear-gradient(135deg, ${elementColor}25, rgba(15,23,42,0.85))`;

  const cardStyle = {
    "--element-color": elementColor,
    "--rarity-bg": rarityBg,
  } as CSSProperties;

  if (variant === "ban-slot") {
    return (
      <div className={`draft-card draft-card-ban group ${isPreview ? "draft-card-preview" : ""}`} style={cardStyle} title={name} role="img" aria-label={`Ban: ${name}`}>
        <Image
          src={chibiUrl}
          alt={name}
          fill
          sizes="96px"
          className="draft-card-image draft-card-image-ban"
          unoptimized
        />
        <div className="ban-overlay" />
        <div className="ban-slot-x" />
        {badge && <span className="badge absolute right-1 top-1 z-10 text-[8px]">{badge}</span>}
      </div>
    );
  }

  if (variant === "pick-slot") {
    const accentBorder = accent === "blue"
      ? "2px solid rgba(56, 189, 248, 0.55)"
      : accent === "red"
        ? "2px solid rgba(251, 113, 133, 0.55)"
        : `2px solid ${elementColor}55`;

    const meta = getCharacterMeta(id);
    const weaponEmoji = WEAPON_ICONS[meta.weapon];

    return (
      <div
        className={`draft-card draft-card-pick group ${isPreview ? "draft-card-preview" : ""}`}
        style={{ ...cardStyle, border: accentBorder, boxShadow: `inset 0 -3px 0 ${elementColor}88` } as CSSProperties}
        title={name}
        role="img"
        aria-label={`${accent === "blue" ? "Blue" : "Red"} pick: ${name}`}
      >
        <Image
          src={chibiUrl}
          alt={name}
          fill
          sizes="108px"
          className="draft-card-image"
          unoptimized
        />
        <span
          className="element-chip"
          style={{ background: `${elementColor}cc` }}
          title={resolvedElement}
        >
          <ElementSymbol element={resolvedElement} />
        </span>
        <span className="char-weapon-badge" title={meta.weapon}>{weaponEmoji}</span>
        {badge && <span className="badge absolute right-1 top-1 z-10 text-[8px]">{badge}</span>}
        <div className="draft-card-name">
          <p>{name}</p>
        </div>
      </div>
    );
  }

  if (variant === "mini-slot") {
    return (
      <div
        className="relative overflow-hidden rounded-lg transition-transform hover:scale-110"
        style={{ width: 40, height: 40, background: rarityBg, border: `1.5px solid ${elementColor}45` }}
        title={name}
      >
        <Image src={chibiUrl} alt={name} fill sizes="40px" className="object-contain" unoptimized />
        {badge && (
          <span className="absolute right-0.5 top-0.5 rounded bg-slate-950/90 px-0.5 text-[7px] font-bold text-slate-100">
            {badge}
          </span>
        )}
      </div>
    );
  }

  const isBanned = disabled && badge?.includes("BAN");
  const classNames = ["draft-card", "draft-card-pool", "char-card", "group"];
  if (selected) classNames.push("selected");
  if (isBanned) classNames.push("banned");
  if (rarity) classNames.push(`rarity-${rarity}`);

  const meta = getCharacterMeta(id);
  const weaponEmoji = WEAPON_ICONS[meta.weapon];
  const rarityStars = rarity === 5 ? "★★★★★" : rarity === 4 ? "★★★★" : "";

  return (
    <button
      className={classNames.join(" ")}
      disabled={disabled}
      onClick={onClick}
      title={name}
      type="button"
      style={{ ...cardStyle, borderBottom: `3px solid ${elementColor}88` } as CSSProperties}
      aria-pressed={selected}
      aria-label={`${name}, ${resolvedElement}, ${rarity} star${disabled ? ", unavailable" : ""}`}
    >
      <span
        className="element-chip element-chip-pool"
        style={{ background: `${elementColor}cc` }}
        title={resolvedElement}
      >
        <ElementSymbol element={resolvedElement} />
      </span>

      {rarityStars && (
        <span className={`char-rarity-badge rarity-badge-${rarity}`} aria-hidden="true">
          {rarityStars}
        </span>
      )}

      <span className="char-weapon-badge" title={meta.weapon}>{weaponEmoji}</span>

      {badge && !isBanned && (
        <span
          className={`badge absolute right-1 bottom-1 z-10 ${
            accent === "blue"
              ? "text-cyan-300"
              : accent === "red"
                ? "text-rose-300"
                : "text-slate-300"
          }`}
        >
          {badge}
        </span>
      )}

      <div className="relative h-full w-full">
        <Image
          src={chibiUrl}
          alt={name}
          fill
          sizes="96px"
          className="draft-card-image draft-card-image-pool"
          unoptimized
        />
      </div>


      {isBanned && <div className="ban-overlay" />}
    </button>
  );
}

function ElementSymbol({ element }: { element: CharacterElement }) {
  const iconUrl = ELEMENT_ICON_URLS[element];

  if (iconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className="element-chip-icon" src={iconUrl} alt="" aria-hidden="true" />
    );
  }

  switch (element) {
    case "Pyro":
      return "Py";
    case "Hydro":
      return "Hy";
    case "Anemo":
      return "An";
    case "Electro":
      return "El";
    case "Dendro":
      return "De";
    case "Cryo":
      return "Cr";
    case "Geo":
      return "Ge";
    default:
      return "Ph";
  }
}

function EmptySlot({
  variant,
  accent,
  placeholder,
  active,
}: {
  variant: string;
  accent: "blue" | "red" | "neutral";
  placeholder?: string;
  active?: boolean;
}) {
  const borderColor =
    accent === "blue"
      ? "rgba(26, 162, 219, 0.72)"
      : accent === "red"
        ? "rgba(206, 43, 78, 0.72)"
        : "rgba(148, 163, 184, 0.28)";

  return (
    <div
      className={`draft-empty-slot draft-empty-${variant} draft-empty-${accent} ${active ? "is-active" : ""}`}
      style={{ "--slot-border": borderColor } as CSSProperties}
    >
      {placeholder ? (
        <span className="text-[9px] font-bold uppercase tracking-wider">{placeholder}</span>
      ) : (
        <UserSilhouette />
      )}
    </div>
  );
}

function UserSilhouette() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-1/2 w-1/2 opacity-90">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-3.5 0-7 1.75-7 5v2h14v-2c0-3.25-3.5-5-7-5z" />
    </svg>
  );
}
