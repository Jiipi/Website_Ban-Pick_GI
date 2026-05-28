"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Save, Search, SlidersHorizontal, Upload, X } from "lucide-react";
import {
  defaultCostCatalog,
  type CostCatalog,
} from "@/domain/cost/CostCatalog";
import type { CharacterElement } from "@/lib/genshin";
import { playClickSound, playConfirmSound, playErrorSound } from "@/lib/sounds";

export type CostCatalogCharacter = {
  id: string;
  name: string;
  element: CharacterElement;
  rarity: 4 | 5;
  chibiIconUrl: string;
};

export type CostCatalogWeapon = {
  id: string;
  name: string;
  type: string;
  rarity: 4 | 5;
  iconUrl: string;
};

type CostCatalogManagerProps = {
  roomCode?: string;
  clientId: string;
  characters: CostCatalogCharacter[];
  weapons: CostCatalogWeapon[];
  catalog?: CostCatalog;
  disabled?: boolean;
  compact?: boolean;
  onSaved?: () => void | Promise<void>;
};

export function CostCatalogManager({
  roomCode,
  clientId,
  characters,
  weapons,
  catalog = defaultCostCatalog,
  disabled = false,
  compact = false,
  onSaved,
}: CostCatalogManagerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [currentCatalog, setCurrentCatalog] = useState(catalog);
  const [editorOpen, setEditorOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function importCostCatalog(file: File | undefined) {
    if (!file || disabled) return;

    setImporting(true);
    setError("");

    try {
      const importedCatalog = JSON.parse(await file.text());
      const response = await fetch("/api/cost-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode, clientId, catalog: importedCatalog }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message ?? "Không nhập được file cost");
        playErrorSound();
        return;
      }

      setCurrentCatalog(data.catalog ?? importedCatalog);
      playConfirmSound();
      await onSaved?.();
      router.refresh();
    } catch {
      setError("File cost không đúng định dạng JSON");
      playErrorSound();
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function saveCostCatalog(nextCatalog: CostCatalog) {
    if (disabled) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/cost-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode, clientId, catalog: nextCatalog }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message ?? "Không lưu được cost");
        playErrorSound();
        return;
      }

      setCurrentCatalog(data.catalog ?? nextCatalog);
      setEditorOpen(false);
      playConfirmSound();
      await onSaved?.();
      router.refresh();
    } catch {
      setError("Không lưu được cost");
      playErrorSound();
    } finally {
      setSaving(false);
    }
  }

  const buttonClass = compact
    ? "inline-flex h-8 items-center gap-1 rounded-md border border-slate-500/45 bg-slate-900/70 px-2 text-[10px] font-black uppercase tracking-wide text-slate-200 transition hover:border-amber-300 hover:text-amber-100 disabled:cursor-wait disabled:opacity-60"
    : "inline-flex h-9 items-center gap-2 rounded-md border border-slate-500/45 bg-slate-950/78 px-3 text-xs font-black uppercase tracking-wide text-slate-100 transition hover:border-amber-300 hover:text-amber-100 disabled:cursor-wait disabled:opacity-60";

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        className={buttonClass}
        disabled={disabled || saving || importing}
        onClick={() => {
          playClickSound();
          setEditorOpen(true);
        }}
        type="button"
      >
        <SlidersHorizontal size={compact ? 12 : 14} />
        Sửa cost
      </button>
      <a
        className={buttonClass}
        href="/api/cost-catalog/template"
        onClick={() => playClickSound()}
      >
        <Download size={compact ? 12 : 14} />
        Mẫu
      </a>
      <button
        className={buttonClass}
        disabled={disabled || importing}
        onClick={() => {
          playClickSound();
          fileInputRef.current?.click();
        }}
        type="button"
      >
        <Upload size={compact ? 12 : 14} />
        {importing ? "Đang nhập" : "Nhập cost"}
      </button>
      <input
        ref={fileInputRef}
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => importCostCatalog(event.target.files?.[0])}
        type="file"
      />
      {error && <p className="basis-full text-right text-[11px] font-bold text-rose-200">{error}</p>}
      {editorOpen && (
        <CostCatalogEditorModal
          catalog={currentCatalog}
          characters={characters}
          weapons={weapons}
          saving={saving}
          onClose={() => setEditorOpen(false)}
          onSave={saveCostCatalog}
        />
      )}
    </div>
  );
}

function CostCatalogEditorModal({
  catalog,
  characters,
  weapons,
  saving,
  onClose,
  onSave,
}: {
  catalog: CostCatalog;
  characters: CostCatalogCharacter[];
  weapons: CostCatalogWeapon[];
  saving: boolean;
  onClose: () => void;
  onSave: (catalog: CostCatalog) => void;
}) {
  const [tab, setTab] = useState<"CHARACTERS" | "WEAPONS">("CHARACTERS");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<CostCatalog>(() => buildEditableCostCatalog(catalog, characters, weapons));

  const normalizedQuery = query.trim().toLowerCase();
  const visibleCharacters = useMemo(
    () => characters.filter((character) => {
      if (!normalizedQuery) return true;
      return character.name.toLowerCase().includes(normalizedQuery) || character.id.toLowerCase().includes(normalizedQuery);
    }),
    [characters, normalizedQuery],
  );
  const visibleWeapons = useMemo(
    () => weapons.filter((weapon) => {
      if (!normalizedQuery) return true;
      return (
        weapon.name.toLowerCase().includes(normalizedQuery) ||
        weapon.id.toLowerCase().includes(normalizedQuery) ||
        weapon.type.toLowerCase().includes(normalizedQuery)
      );
    }),
    [weapons, normalizedQuery],
  );

  function updateCharacterCost(character: CostCatalogCharacter, patch: { baseCost?: number; constellationCost?: number }) {
    setDraft((previous) => ({
      ...previous,
      characters: {
        ...previous.characters,
        [character.id]: {
          name: character.name,
          rarity: character.rarity,
          element: character.element,
          ...previous.characters[character.id],
          ...patch,
        },
      },
    }));
  }

  function updateWeaponCost(weapon: CostCatalogWeapon, cost: number) {
    setDraft((previous) => ({
      ...previous,
      weapons: {
        ...previous.weapons,
        [weapon.id]: {
          name: weapon.name,
          type: weapon.type,
          rarity: weapon.rarity,
          ...previous.weapons[weapon.id],
          cost,
        },
      },
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/78 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-slate-500/30 bg-slate-950/96 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/50 px-4 py-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-300">Catalog cost</p>
            <h2 className="text-base font-black text-slate-100">Sửa cost nhân vật và vũ khí</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-400/50 bg-emerald-500/15 px-3 text-xs font-black uppercase text-emerald-100 transition hover:bg-emerald-500/25 disabled:cursor-wait disabled:opacity-60"
              disabled={saving}
              onClick={() => onSave({ ...draft, updatedAt: new Date().toISOString() })}
              type="button"
            >
              <Save size={14} />
              {saving ? "Đang lưu" : "Lưu cost"}
            </button>
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-600/50 text-slate-300 transition hover:border-rose-300 hover:text-rose-200"
              disabled={saving}
              onClick={() => {
                playClickSound();
                onClose();
              }}
              type="button"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="grid gap-3 border-b border-slate-700/40 p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              className="h-10 w-full rounded-md border border-slate-700/60 bg-slate-900/70 pl-9 pr-3 text-sm font-semibold text-slate-100 outline-none focus:border-cyan-300"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tab === "CHARACTERS" ? "Tìm nhân vật..." : "Tìm vũ khí..."}
              value={query}
            />
          </div>
          <div className="grid grid-cols-2 overflow-hidden rounded-md border border-slate-700/60">
            <button
              className={`h-10 px-4 text-xs font-black uppercase transition ${
                tab === "CHARACTERS" ? "bg-cyan-500/18 text-cyan-100" : "bg-slate-900/45 text-slate-400 hover:text-slate-100"
              }`}
              onClick={() => {
                playClickSound();
                setTab("CHARACTERS");
                setQuery("");
              }}
              type="button"
            >
              Nhân vật
            </button>
            <button
              className={`h-10 px-4 text-xs font-black uppercase transition ${
                tab === "WEAPONS" ? "bg-purple-500/20 text-purple-100" : "bg-slate-900/45 text-slate-400 hover:text-slate-100"
              }`}
              onClick={() => {
                playClickSound();
                setTab("WEAPONS");
                setQuery("");
              }}
              type="button"
            >
              Vũ khí
            </button>
          </div>
        </div>

        <div className="grid gap-3 border-b border-slate-700/40 p-4 md:grid-cols-5">
          <CatalogNumberField label="Mốc 4 sao" value={draft.defaults.character.rarity4Base} onChange={(value) => setDraft((previous) => ({ ...previous, defaults: { ...previous.defaults, character: { ...previous.defaults.character, rarity4Base: value } } }))} />
          <CatalogNumberField label="Mốc 5 sao" value={draft.defaults.character.rarity5Base} onChange={(value) => setDraft((previous) => ({ ...previous, defaults: { ...previous.defaults, character: { ...previous.defaults.character, rarity5Base: value } } }))} />
          <CatalogNumberField label="Cost mỗi cung" value={draft.defaults.character.constellationCost} onChange={(value) => setDraft((previous) => ({ ...previous, defaults: { ...previous.defaults, character: { ...previous.defaults.character, constellationCost: value } } }))} />
          <CatalogNumberField label="Vũ khí 4 sao" value={draft.defaults.weapon.rarity4} onChange={(value) => setDraft((previous) => ({ ...previous, defaults: { ...previous.defaults, weapon: { ...previous.defaults.weapon, rarity4: value } } }))} />
          <CatalogNumberField label="Vũ khí 5 sao" value={draft.defaults.weapon.rarity5} onChange={(value) => setDraft((previous) => ({ ...previous, defaults: { ...previous.defaults, weapon: { ...previous.defaults.weapon, rarity5: value } } }))} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === "CHARACTERS" ? (
            <div className="grid gap-2 lg:grid-cols-2">
              {visibleCharacters.map((character) => {
                const rule = draft.characters[character.id];
                return (
                  <div key={character.id} className="grid grid-cols-[52px_minmax(0,1fr)_88px_88px] items-center gap-3 rounded-md border border-cyan-500/22 bg-slate-900/45 p-2">
                    <div className="relative h-12 w-12 overflow-hidden rounded-md bg-slate-950/60">
                      <Image src={character.chibiIconUrl} alt={character.name} fill sizes="48px" className="object-contain" unoptimized />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-100" title={character.name}>{character.name}</p>
                      <p className={`text-[10px] font-black ${character.rarity === 5 ? "text-amber-300" : "text-purple-300"}`}>{character.rarity}★</p>
                    </div>
                    <CatalogNumberField label="Mốc" value={rule?.baseCost ?? getCharacterBaseCost(catalog, character)} onChange={(value) => updateCharacterCost(character, { baseCost: value })} />
                    <CatalogNumberField label="Mỗi cung" value={rule?.constellationCost ?? getCharacterConstellationCost(catalog, character)} onChange={(value) => updateCharacterCost(character, { constellationCost: value })} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid gap-2 lg:grid-cols-2">
              {visibleWeapons.map((weapon) => {
                const rule = draft.weapons[weapon.id];
                return (
                  <div key={weapon.id} className="grid grid-cols-[52px_minmax(0,1fr)_92px] items-center gap-3 rounded-md border border-purple-500/22 bg-slate-900/45 p-2">
                    <div className="relative h-12 w-12 overflow-hidden rounded-md bg-slate-950/60">
                      <Image src={weapon.iconUrl} alt={weapon.name} fill sizes="48px" className="object-contain p-1" unoptimized />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-100" title={weapon.name}>{weapon.name}</p>
                      <p className="truncate text-[10px] font-bold uppercase text-slate-500">{weapon.type} · {weapon.rarity}★</p>
                    </div>
                    <CatalogNumberField label="Cost" value={rule?.cost ?? getWeaponCost(catalog, weapon)} onChange={(value) => updateWeaponCost(weapon, value)} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CatalogNumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block truncate text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</span>
      <input
        className="h-9 w-full rounded-md border border-slate-700/60 bg-slate-950/70 px-2 text-sm font-black tabular-nums text-slate-100 outline-none focus:border-cyan-300"
        min={0}
        onChange={(event) => onChange(parseCostInput(event.target.value))}
        step={0.25}
        type="number"
        value={value}
      />
    </label>
  );
}

function getWeaponCost(costCatalog: CostCatalog, weapon: CostCatalogWeapon): number {
  const ruleCost = costCatalog.weapons[weapon.id]?.cost;
  if (typeof ruleCost === "number" && Number.isFinite(ruleCost)) return ruleCost;
  return weapon.rarity === 5 ? costCatalog.defaults.weapon.rarity5 : costCatalog.defaults.weapon.rarity4;
}

function getCharacterBaseCost(costCatalog: CostCatalog, character: CostCatalogCharacter): number {
  const ruleCost = costCatalog.characters[character.id]?.baseCost;
  if (typeof ruleCost === "number" && Number.isFinite(ruleCost)) return ruleCost;
  return character.rarity === 5 ? costCatalog.defaults.character.rarity5Base : costCatalog.defaults.character.rarity4Base;
}

function getCharacterConstellationCost(costCatalog: CostCatalog, character: CostCatalogCharacter): number {
  const ruleCost = costCatalog.characters[character.id]?.constellationCost;
  if (typeof ruleCost === "number" && Number.isFinite(ruleCost)) return ruleCost;
  return character.rarity === 5 ? costCatalog.defaults.character.constellationCost : 0;
}

function buildEditableCostCatalog(catalog: CostCatalog, characters: CostCatalogCharacter[], weapons: CostCatalogWeapon[]): CostCatalog {
  return {
    version: 1,
    updatedAt: catalog.updatedAt,
    defaults: {
      character: { ...catalog.defaults.character },
      weapon: { ...catalog.defaults.weapon },
    },
    characters: Object.fromEntries(
      characters.map((character) => [
        character.id,
        {
          name: character.name,
          rarity: character.rarity,
          element: character.element,
          ...catalog.characters[character.id],
          baseCost: getCharacterBaseCost(catalog, character),
          constellationCost: getCharacterConstellationCost(catalog, character),
        },
      ]),
    ),
    weapons: Object.fromEntries(
      weapons.map((weapon) => [
        weapon.id,
        {
          name: weapon.name,
          type: weapon.type,
          rarity: weapon.rarity,
          ...catalog.weapons[weapon.id],
          cost: getWeaponCost(catalog, weapon),
        },
      ]),
    ),
  };
}

function parseCostInput(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Number(parsed.toFixed(4)) : 0;
}
