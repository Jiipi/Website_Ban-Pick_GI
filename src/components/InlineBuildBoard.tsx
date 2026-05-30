"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Search, Trophy, X } from "lucide-react";
import { BanRow } from "@/components/draft/BanRow";
import { PickGrid } from "@/components/PickGrid";
import { authFetch, getSession } from "@/lib/auth";
import { PICKS_PER_TEAM } from "@/lib/constants";
import {
  calculateBuildCost,
  defaultCostCatalog,
  type CostCatalog,
} from "@/domain/cost/CostCatalog";
import type { DraftEntry } from "@/lib/draft";
import type { GenshinCharacter } from "@/lib/genshin";
import { canEditBuild } from "@/lib/permissions";
import { playClickSound, playConfirmSound, playErrorSound } from "@/lib/sounds";
import type { Session, TeamSide } from "@/lib/types";
import { useDraftStore } from "@/stores/draftStore";
import { broadcastRoomUpdate, broadcastBuildSaved, broadcastBuildPreview } from "@/components/RealtimeRefresh";

type NamedPick = { characterId: string; name: string };
type ExistingBuild = {
  player: string;
  characterId: string;
  rarity: number;
  consLevel: number;
  weaponRarity: number;
  weaponRefinement?: number | null;
  weaponId?: string | null;
  weaponName?: string | null;
  weaponIconUrl?: string | null;
  enkaSnapshot?: unknown;
  totalCost: number;
  source?: string;
};
type BuildValue = {
  characterId: string;
  rarity: number;
  consLevel: number;
  weaponRarity: number;
  weaponRefinement: number;
  weaponId: string | null;
  weaponName: string | null;
  weaponIconUrl: string | null;
  weaponType: string | null;
  characterBaseCost: number;
  constellationCost: number;
  weaponCost: number;
  totalCost: number;
};
type TeamSummary = {
  total: number;
  milestoneCost: number;
  consCost: number;
  weaponCost: number;
  submitted: number;
};

type TimeAdjustment = {
  mode: "FASTER" | "SLOWER" | "EVEN";
  seconds: number;
  label: string;
};

type WeaponPickerTarget = {
  team: TeamSide;
  characterId: string;
  characterName: string;
} | null;

type InlineBuildBoardProps = {
  roomCode: string;
  roomId: string;
  viewerClientId: string;
  logs: DraftEntry[];
  characters: GenshinCharacter[];
  weapons: WeaponItem[];
  costCatalog?: CostCatalog;
  bluePicks: NamedPick[];
  redPicks: NamedPick[];
  existingBuilds: ExistingBuild[];
  status: string;
  costPerPoint: number;
  blueClientId: string | null;
  redClientId: string | null;
  hostClientId: string | null;
  bluePlayerName: string | null;
  redPlayerName: string | null;
  blueUid: string | null;
  redUid: string | null;
  blueNickname: string | null;
  redNickname: string | null;
  blueAvatarUrl: string | null;
  redAvatarUrl: string | null;
};

type WeaponItem = {
  id: string;
  name: string;
  type: string;
  rarity: 4 | 5;
  iconUrl: string;
};

const TEAM_COPY: Record<TeamSide, { label: string; tone: "blue" | "red" }> = {
  BLUE: { label: "Đội Xanh", tone: "blue" },
  RED: { label: "Đội Đỏ", tone: "red" },
};

export function InlineBuildBoard(props: InlineBuildBoardProps) {
  const {
    roomCode,
    roomId,
    viewerClientId,
    logs,
    characters,
    weapons,
    costCatalog,
    bluePicks,
    redPicks,
    existingBuilds,
    status,
    costPerPoint,
    blueClientId,
    redClientId,
    hostClientId,
    bluePlayerName,
    redPlayerName,
    blueUid,
    redUid,
    blueNickname,
    redNickname,
    blueAvatarUrl,
    redAvatarUrl,
  } = props;

  const router = useRouter();
  const characterMap = useMemo(() => new Map(characters.map((character) => [character.id, character])), [characters]);
  const realtimeBuilds = useDraftStore((state) => state.realtimeBuilds);
  const realtimeBuildPreviews = useDraftStore((state) => state.realtimeBuildPreviews);
  const realtimeStatus = useDraftStore((state) => state.realtimeStatus);
  const mergeBuildEntry = useDraftStore((state) => state.mergeBuildEntry);
  const realtimeCostCatalog = useDraftStore((state) => state.realtimeCostCatalog);
  const fetchRoomData = useDraftStore((state) => state.fetchRoomData);
  const activeCostCatalog = realtimeCostCatalog ?? costCatalog ?? defaultCostCatalog;
  const savedBuilds = useMemo(
    () => (realtimeBuilds ?? existingBuilds).filter(isSavedBuild),
    [realtimeBuilds, existingBuilds],
  );
  const activeBuilds = useMemo(
    () => mergeBuildLists(savedBuilds, realtimeBuildPreviews),
    [savedBuilds, realtimeBuildPreviews],
  );
  const liveStatus = realtimeStatus ?? status;
  const [session, setSession] = useState<Session | null>(null);
  const [finishBusy, setFinishBusy] = useState(false);
  const [values, setValues] = useState<Record<TeamSide, Record<string, BuildValue>>>(() => ({
    BLUE: seedBuildValues("BLUE", bluePicks, existingBuilds, characterMap, weapons, activeCostCatalog),
    RED: seedBuildValues("RED", redPicks, existingBuilds, characterMap, weapons, activeCostCatalog),
  }));
  const [dirtyTeams, setDirtyTeams] = useState<Record<TeamSide, boolean>>({ BLUE: false, RED: false });
  const [savingTeam, setSavingTeam] = useState<TeamSide | null>(null);
  const [error, setError] = useState("");
  const [weaponPickerTarget, setWeaponPickerTarget] = useState<WeaponPickerTarget>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setSession(getSession(roomCode));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [roomCode]);

  useEffect(() => {
    if (liveStatus === "FINISHED") {
      router.push(`/room/${roomCode}/result`);
    }
  }, [liveStatus, roomCode, router]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setValues((previous) => ({
        BLUE: dirtyTeams.BLUE ? previous.BLUE : seedBuildValues("BLUE", bluePicks, activeBuilds, characterMap, weapons, activeCostCatalog),
        RED: dirtyTeams.RED ? previous.RED : seedBuildValues("RED", redPicks, activeBuilds, characterMap, weapons, activeCostCatalog),
      }));
    });
    return () => {
      cancelled = true;
    };
  }, [activeBuilds, activeCostCatalog, bluePicks, redPicks, characterMap, weapons, dirtyTeams.BLUE, dirtyTeams.RED]);

  const room = useMemo(
    () => ({ hostClientId, blueClientId, redClientId, status: liveStatus }),
    [hostClientId, blueClientId, redClientId, liveStatus],
  );

  const bansBlue = useMemo(
    () => logs.filter((log) => log.action === "BAN" && log.player === "BLUE"),
    [logs],
  );
  const bansRed = useMemo(
    () => logs.filter((log) => log.action === "BAN" && log.player === "RED"),
    [logs],
  );
  const pickEntriesBlue = useMemo(
    () => logs.filter((log) => log.action === "PICK" && log.player === "BLUE").slice(0, PICKS_PER_TEAM),
    [logs],
  );
  const pickEntriesRed = useMemo(
    () => logs.filter((log) => log.action === "PICK" && log.player === "RED").slice(0, PICKS_PER_TEAM),
    [logs],
  );

  const blueSummary = useMemo(
    () => summarizeTeam("BLUE", bluePicks, values.BLUE, activeBuilds, characterMap, activeCostCatalog),
    [bluePicks, values.BLUE, activeBuilds, characterMap, activeCostCatalog],
  );
  const redSummary = useMemo(
    () => summarizeTeam("RED", redPicks, values.RED, activeBuilds, characterMap, activeCostCatalog),
    [redPicks, values.RED, activeBuilds, characterMap, activeCostCatalog],
  );
  const blueSavedSummary = useMemo(
    () => summarizeTeam("BLUE", bluePicks, values.BLUE, savedBuilds, characterMap, activeCostCatalog),
    [bluePicks, values.BLUE, savedBuilds, characterMap, activeCostCatalog],
  );
  const redSavedSummary = useMemo(
    () => summarizeTeam("RED", redPicks, values.RED, savedBuilds, characterMap, activeCostCatalog),
    [redPicks, values.RED, savedBuilds, characterMap, activeCostCatalog],
  );
  const blueDisplaySummary = useMemo(
    () => ({ ...blueSummary, submitted: blueSavedSummary.submitted }),
    [blueSummary, blueSavedSummary.submitted],
  );
  const redDisplaySummary = useMemo(
    () => ({ ...redSummary, submitted: redSavedSummary.submitted }),
    [redSummary, redSavedSummary.submitted],
  );
  const lead = useMemo(
    () => calculateLead(blueSummary.total, redSummary.total, costPerPoint),
    [blueSummary.total, redSummary.total, costPerPoint],
  );

  function updateBuild(team: TeamSide, characterId: string, patch: Partial<BuildValue>) {
    if (!canEditBuild(room, session, team)) return;
    setDirtyTeams((previous) => ({ ...previous, [team]: true }));
    setValues((previous) => {
      const current = previous[team][characterId] ?? defaultBuild(characterId, characterMap, activeCostCatalog);
      const next = withCalculatedCost({ ...current, ...patch }, activeCostCatalog);
      const nextTeamValues = {
        ...previous[team],
        [characterId]: next,
      };
      const picks = team === "BLUE" ? bluePicks : redPicks;
      if (session) {
        broadcastBuildPreview(roomCode, team, buildPreviewPayload(team, picks, nextTeamValues, characterMap, activeCostCatalog), session.clientId);
      }
      return {
        ...previous,
        [team]: nextTeamValues,
      };
    });
  }

  async function saveTeam(team: TeamSide, picks: NamedPick[], options: { silent?: boolean } = {}) {
    if (!session || !canEditBuild(room, session, team)) return;
    setSavingTeam(team);
    setError("");

    const builds = picks.map((pick) => values[team][pick.characterId] ?? defaultBuild(pick.characterId, characterMap, activeCostCatalog));
    const response = await authFetch("/api/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomCode, clientId: session.clientId, player: team, builds }),
    });

    const data = await response.json();
    setSavingTeam(null);

    if (!response.ok) {
      setError(data.message ?? "Không lưu được build");
      playErrorSound();
      return;
    }

    if (!options.silent) {
      playConfirmSound();
    }
    if (Array.isArray(data.builds)) {
      for (const build of data.builds) {
        mergeBuildEntry(build);
      }
    }
    setDirtyTeams((previous) => ({ ...previous, [team]: false }));
    broadcastRoomUpdate(roomId);
    broadcastBuildSaved(roomCode, team, session.clientId);
    if (liveStatus === "FINISHED") {
      router.refresh();
    }
  }

  useEffect(() => {
    if (!session) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const scheduleSave = (team: TeamSide, picks: NamedPick[]) => {
      if (!dirtyTeams[team] || savingTeam === team || picks.length !== PICKS_PER_TEAM || !canEditBuild(room, session, team)) return;
      timers.push(setTimeout(() => void saveTeam(team, picks, { silent: true }), 450));
    };

    scheduleSave("BLUE", bluePicks);
    scheduleSave("RED", redPicks);

    return () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
    };
  }, [bluePicks, dirtyTeams, redPicks, room, savingTeam, session, values]);

  async function finishMatch() {
    if (!session || !viewerIsHost) return;
    if (!canFinishMatch) {
      setError(`Chưa đủ build để tổng kết: Đội Xanh ${blueSavedSummary.submitted}/${PICKS_PER_TEAM}, Đội Đỏ ${redSavedSummary.submitted}/${PICKS_PER_TEAM}. Hai đội cần bấm Lưu.`);
      playErrorSound();
      return;
    }
    setFinishBusy(true);
    setError("");
    playClickSound();

    const response = await authFetch(`/api/room/${roomCode}/host`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: session.clientId, action: "FINISH_MATCH" }),
    });

    setFinishBusy(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.message ?? "Không thể tổng kết");
      playErrorSound();
      return;
    }

    playConfirmSound();
    router.push(`/room/${roomCode}/result`);
  }

  function selectWeapon(target: NonNullable<WeaponPickerTarget>, weapon: WeaponItem) {
    updateBuild(target.team, target.characterId, {
      weaponId: weapon.id,
      weaponName: weapon.name,
      weaponIconUrl: weapon.iconUrl,
      weaponType: weapon.type,
      weaponRarity: weapon.rarity,
      weaponRefinement: 1,
    });
    setWeaponPickerTarget(null);
  }

  function clearWeapon(target: NonNullable<WeaponPickerTarget>) {
    updateBuild(target.team, target.characterId, {
      weaponId: null,
      weaponName: null,
      weaponIconUrl: null,
      weaponType: null,
      weaponRarity: 4,
      weaponRefinement: 1,
    });
    setWeaponPickerTarget(null);
  }

  const blueCanEdit = canEditBuild(room, session, "BLUE");
  const redCanEdit = canEditBuild(room, session, "RED");
  const effectiveViewerClientId = session?.clientId || viewerClientId;
  const viewerIsHost = Boolean(effectiveViewerClientId && hostClientId === effectiveViewerClientId);
  const viewerTeam: TeamSide | null =
    session?.team ??
    (effectiveViewerClientId && blueClientId === effectiveViewerClientId
      ? "BLUE"
      : effectiveViewerClientId && redClientId === effectiveViewerClientId
        ? "RED"
        : null);
  const canFinishMatch = blueSavedSummary.submitted >= PICKS_PER_TEAM && redSavedSummary.submitted >= PICKS_PER_TEAM;
  const buildTeam = viewerIsHost ? null : viewerTeam;
  const playerBuild = buildTeam
    ? {
        team: buildTeam,
        tone: TEAM_COPY[buildTeam].tone,
        summary: buildTeam === "BLUE" ? blueDisplaySummary : redDisplaySummary,
        picks: buildTeam === "BLUE" ? bluePicks : redPicks,
        values: buildTeam === "BLUE" ? values.BLUE : values.RED,
        canEdit: buildTeam === "BLUE" ? blueCanEdit : redCanEdit,
        timeAdjustment: buildTeam === "BLUE" ? lead.blue : lead.red,
      }
    : null;

  return (
    <div className="mx-auto grid min-h-[calc(100vh-1rem)] w-full max-w-[1920px] grid-rows-[auto_minmax(250px,34vh)_auto_auto] gap-2 px-1 py-1">
      <header className="relative grid min-h-[74px] grid-cols-[minmax(0,1fr)_minmax(230px,340px)_minmax(0,1fr)] items-start gap-4">
        <div className="flex justify-end">
          <BanRow accent="blue" entries={bansBlue} characterMap={characterMap} activeIndex={-1} />
        </div>
        <div className="draft-step-pill">
          <span>Giai đoạn khai báo build</span>
        </div>
        <div className="flex justify-start">
          <BanRow accent="red" entries={bansRed} characterMap={characterMap} activeIndex={-1} />
        </div>
        <div className="absolute left-1 top-1 rounded-md border border-slate-500/30 bg-slate-950/60 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-100">
          {roomCode}
        </div>
      </header>

      <section className="grid min-h-0 grid-cols-[minmax(120px,210px)_minmax(300px,470px)_minmax(130px,180px)_minmax(300px,470px)_minmax(120px,210px)] items-center justify-center gap-3">
        <PlayerPlate tone="blue" name={bluePlayerName} uid={blueUid} nickname={blueNickname} avatarUrl={blueAvatarUrl} />
        <PickGrid accent="blue" entries={pickEntriesBlue} characterMap={characterMap} isActive={false} />
        <CenterLead lead={lead} costPerPoint={costPerPoint} />
        <PickGrid accent="red" entries={pickEntriesRed} characterMap={characterMap} isActive={false} />
        <PlayerPlate tone="red" name={redPlayerName} uid={redUid} nickname={redNickname} avatarUrl={redAvatarUrl} />
      </section>

      {playerBuild ? (
        <section className="mx-auto grid w-full max-w-[1180px] min-h-0 grid-cols-[minmax(220px,280px)_minmax(0,1fr)] gap-3">
          <CostPanel tone={playerBuild.tone} summary={playerBuild.summary} timeAdjustment={playerBuild.timeAdjustment} />
          <TeamWeaponBoard
            team={playerBuild.team}
            picks={playerBuild.picks}
            values={playerBuild.values}
            characterMap={characterMap}
            weapons={weapons}
            costCatalog={activeCostCatalog}
            canEdit={playerBuild.canEdit}
            saving={savingTeam === playerBuild.team}
            onChange={updateBuild}
            onOpenWeaponPicker={setWeaponPickerTarget}
            onSave={() => saveTeam(playerBuild.team, playerBuild.picks)}
          />
        </section>
      ) : (
        <section className="grid min-h-0 grid-cols-[minmax(220px,260px)_minmax(0,1fr)_minmax(0,1fr)_minmax(220px,260px)] gap-3">
          <CostPanel tone="blue" summary={blueDisplaySummary} timeAdjustment={lead.blue} />
          <TeamWeaponBoard
            team="BLUE"
            picks={bluePicks}
            values={values.BLUE}
            characterMap={characterMap}
            weapons={weapons}
            costCatalog={activeCostCatalog}
            canEdit={blueCanEdit}
            saving={savingTeam === "BLUE"}
            onChange={updateBuild}
            onOpenWeaponPicker={setWeaponPickerTarget}
            onSave={() => saveTeam("BLUE", bluePicks)}
          />
          <TeamWeaponBoard
            team="RED"
            picks={redPicks}
            values={values.RED}
            characterMap={characterMap}
            weapons={weapons}
            costCatalog={activeCostCatalog}
            canEdit={redCanEdit}
            saving={savingTeam === "RED"}
            onChange={updateBuild}
            onOpenWeaponPicker={setWeaponPickerTarget}
            onSave={() => saveTeam("RED", redPicks)}
          />
          <CostPanel tone="red" summary={redDisplaySummary} timeAdjustment={lead.red} />
        </section>
      )}

      {error && (
        <p className="rounded-lg border border-red-800/50 bg-red-950/50 px-4 py-2 text-sm font-semibold text-red-200">
          {error}
        </p>
      )}

      <footer className={`mx-auto grid w-full items-center gap-3 rounded-lg border border-slate-600/30 bg-slate-950/75 p-3 ${
        playerBuild
          ? "max-w-[760px] grid-cols-[1fr_auto]"
          : "max-w-[1180px] grid-cols-[1fr_minmax(240px,360px)_auto_1fr]"
      }`}>
        {playerBuild ? (
          <div className={`rounded-md border px-4 py-2 text-xs font-black uppercase tracking-wide ${
            playerBuild.team === "BLUE"
              ? "border-cyan-500/30 bg-cyan-950/30 text-cyan-200"
              : "border-rose-500/30 bg-rose-950/30 text-rose-200"
          }`}>
            {playerBuild.team === "BLUE" ? "Đội Xanh" : "Đội Đỏ"} {playerBuild.summary.submitted}/{PICKS_PER_TEAM}
          </div>
        ) : (
          <>
            <div className="rounded-md border border-cyan-500/30 bg-cyan-950/30 px-4 py-2 text-xs font-black uppercase tracking-wide text-cyan-200">
              Đội Xanh {blueDisplaySummary.submitted}/{PICKS_PER_TEAM}
            </div>
            <div className="flex min-h-10 flex-wrap items-center justify-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-950/30 px-3 py-2 text-xs font-black uppercase tracking-wide text-emerald-200">
              <span>Hai đội có thể lưu build song song</span>
            </div>
          </>
        )}
        {viewerIsHost ? (
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-amber-400/60 bg-amber-500/15 px-4 text-sm font-black uppercase tracking-wide text-amber-200 transition hover:bg-amber-500/25 disabled:cursor-wait disabled:opacity-60"
            disabled={finishBusy || !canFinishMatch}
            onClick={finishMatch}
            title={!canFinishMatch ? `Chưa đủ build: Xanh ${blueDisplaySummary.submitted}/${PICKS_PER_TEAM}, Đỏ ${redDisplaySummary.submitted}/${PICKS_PER_TEAM}` : undefined}
            type="button"
          >
            <Trophy size={16} />
            {finishBusy ? "Đang tổng kết..." : canFinishMatch ? "Tổng kết" : "Chưa đủ build"}
          </button>
        ) : (
          <span className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-amber-400/40 bg-amber-500/10 px-4 text-xs font-black uppercase tracking-wide text-amber-200">
            <Trophy size={14} />
            Chờ trọng tài tổng kết
          </span>
        )}
        {!playerBuild && (
          <div className="rounded-md border border-rose-500/30 bg-rose-950/30 px-4 py-2 text-right text-xs font-black uppercase tracking-wide text-rose-200">
            Đội Đỏ {redDisplaySummary.submitted}/{PICKS_PER_TEAM}
          </div>
        )}
      </footer>
      {weaponPickerTarget && (
        <WeaponPickerModal
          target={weaponPickerTarget}
          weapons={weapons}
          costCatalog={activeCostCatalog}
          onClose={() => setWeaponPickerTarget(null)}
          onClear={() => clearWeapon(weaponPickerTarget)}
          onSelect={(weapon) => selectWeapon(weaponPickerTarget, weapon)}
        />
      )}
    </div>
  );
}

function TeamWeaponBoard({
  team,
  picks,
  values,
  characterMap,
  weapons,
  costCatalog,
  canEdit,
  saving,
  onChange,
  onOpenWeaponPicker,
  onSave,
}: {
  team: TeamSide;
  picks: NamedPick[];
  values: Record<string, BuildValue>;
  characterMap: Map<string, GenshinCharacter>;
  weapons: WeaponItem[];
  costCatalog: CostCatalog;
  canEdit: boolean;
  saving: boolean;
  onChange: (team: TeamSide, characterId: string, patch: Partial<BuildValue>) => void;
  onOpenWeaponPicker: (target: NonNullable<WeaponPickerTarget>) => void;
  onSave: () => void;
}) {
  const copy = TEAM_COPY[team];
  const disabled = saving || picks.length !== PICKS_PER_TEAM || !canEdit;

  return (
    <article className={`rounded-lg border bg-slate-950/40 p-3 ${panelBorder(copy.tone)}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className={`text-[11px] font-black uppercase tracking-[0.28em] ${toneText(copy.tone)}`}>{copy.label}</p>
          <h2 className="text-sm font-bold text-slate-100">Ô vũ khí</h2>
        </div>
        <button
          className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-black uppercase tracking-wide transition ${
            disabled
              ? "cursor-not-allowed border border-slate-700/50 bg-slate-900/40 text-slate-500"
              : "border border-emerald-400/50 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
          }`}
          disabled={disabled}
          onClick={onSave}
          type="button"
        >
          <Save size={14} />
          {saving ? "Đang lưu" : canEdit ? "Lưu" : "Chỉ xem"}
        </button>
      </div>
      <div className="grid gap-3 2xl:grid-cols-2">
        <HalfWeaponPanel
          label="Nửa đầu"
          team={team}
          picks={picks.slice(0, 4)}
          values={values}
          characterMap={characterMap}
          weapons={weapons}
          costCatalog={costCatalog}
          canEdit={canEdit}
          onChange={onChange}
          onOpenWeaponPicker={onOpenWeaponPicker}
        />
        <HalfWeaponPanel
          label="Nửa sau"
          team={team}
          picks={picks.slice(4, 8)}
          values={values}
          characterMap={characterMap}
          weapons={weapons}
          costCatalog={costCatalog}
          canEdit={canEdit}
          onChange={onChange}
          onOpenWeaponPicker={onOpenWeaponPicker}
        />
      </div>
    </article>
  );
}

function HalfWeaponPanel({
  label,
  team,
  picks,
  values,
  characterMap,
  weapons,
  costCatalog,
  canEdit,
  onChange,
  onOpenWeaponPicker,
}: {
  label: string;
  team: TeamSide;
  picks: NamedPick[];
  values: Record<string, BuildValue>;
  characterMap: Map<string, GenshinCharacter>;
  weapons: WeaponItem[];
  costCatalog: CostCatalog;
  canEdit: boolean;
  onChange: (team: TeamSide, characterId: string, patch: Partial<BuildValue>) => void;
  onOpenWeaponPicker: (target: NonNullable<WeaponPickerTarget>) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-500/20 bg-slate-900/22 p-2">
      <p className="mb-2 text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <div className="grid grid-cols-4 gap-2">
        {picks.map((pick) => {
          const character = characterMap.get(pick.characterId);
          const value = values[pick.characterId] ?? defaultBuild(pick.characterId, characterMap, costCatalog);
          return (
            <BuildWeaponSlot
              key={`${team}-${pick.characterId}`}
              team={team}
              pick={pick}
              character={character}
              value={value}
              weapons={weapons}
              canEdit={canEdit}
              onChange={onChange}
              onOpenWeaponPicker={onOpenWeaponPicker}
            />
          );
        })}
      </div>
    </section>
  );
}

function BuildWeaponSlot({
  team,
  pick,
  character,
  value,
  weapons,
  canEdit,
  onChange,
  onOpenWeaponPicker,
}: {
  team: TeamSide;
  pick: NamedPick;
  character?: GenshinCharacter;
  value: BuildValue;
  weapons: WeaponItem[];
  canEdit: boolean;
  onChange: (team: TeamSide, characterId: string, patch: Partial<BuildValue>) => void;
  onOpenWeaponPicker: (target: NonNullable<WeaponPickerTarget>) => void;
}) {
  const tone = TEAM_COPY[team].tone;
  const characterIconUrl = character?.chibiIconUrl ?? `/api/chibi?name=${encodeURIComponent(pick.name)}`;
  const selectedWeapon = value.weaponId ? weapons.find((weapon) => weapon.id === value.weaponId) : null;
  const weaponIconUrl = selectedWeapon?.iconUrl ?? value.weaponIconUrl;
  const weaponName = selectedWeapon?.name ?? value.weaponName ?? "Chọn vũ khí";
  const weaponType = selectedWeapon?.type ?? value.weaponType;

  return (
    <div className="min-w-0 space-y-1">
      <div className={`overflow-hidden rounded-md border bg-slate-950/70 ${panelBorder(tone)}`}>
        <div className="relative aspect-square bg-slate-900/70">
          <Image
            src={characterIconUrl}
            alt={pick.name}
            fill
            sizes="92px"
            className="object-contain"
            unoptimized
          />
          <span className="absolute left-1 top-1 rounded bg-slate-950/85 px-1.5 py-0.5 text-[10px] font-black text-slate-100">
            C{value.consLevel}
          </span>
          <span className="absolute right-1 top-1 rounded bg-slate-950/85 px-1.5 py-0.5 text-[10px] font-black text-amber-200">
            {formatCost(value.totalCost)}
          </span>
          <div className="absolute inset-x-1 bottom-1">
            <select
              className="h-7 w-full rounded border border-slate-600/45 bg-slate-950/85 px-1.5 text-xs font-bold text-slate-100 outline-none focus:border-cyan-300 disabled:opacity-55"
              disabled={!canEdit}
              value={value.consLevel}
              onChange={(event) => {
                playClickSound();
                onChange(team, pick.characterId, { consLevel: Number(event.target.value) });
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6].map((level) => (
                <option key={level} value={level}>C{level}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="px-1.5 py-1">
          <p className="truncate text-center text-[10px] font-black text-slate-100" title={pick.name}>
            {pick.name}
          </p>
        </div>
      </div>

      <div className={`relative overflow-hidden rounded-md border bg-slate-950/45 ${panelBorder(tone)}`}>
        <button
          className={`relative block aspect-square w-full bg-slate-950/45 transition ${
            canEdit ? "hover:bg-slate-900/70" : "cursor-default opacity-75"
          }`}
          disabled={!canEdit}
          onClick={() => {
            playClickSound();
            onOpenWeaponPicker({ team, characterId: pick.characterId, characterName: pick.name });
          }}
          title={weaponName}
          type="button"
        >
          {weaponIconUrl ? (
            <>
              <Image src={weaponIconUrl} alt={weaponName} fill sizes="92px" className="object-contain p-2" unoptimized />
              <span className={`absolute right-1 top-1 rounded bg-slate-950/85 px-1.5 py-0.5 text-[10px] font-black ${value.weaponRarity === 5 ? "text-amber-200" : "text-purple-200"}`}>
                {value.weaponRarity}★
              </span>
              {weaponType && (
                <span className="absolute left-1 top-1 rounded bg-slate-950/82 px-1.5 py-0.5 text-[8px] font-black uppercase text-slate-300">
                  {weaponType}
                </span>
              )}
            </>
          ) : (
            <span className="flex h-full w-full items-center justify-center text-3xl font-light text-slate-300">+</span>
          )}
        </button>
        {value.weaponId ? (
          <div className="border-t border-slate-700/45 bg-slate-950/85 px-1 py-1">
            <select
              className="h-7 w-full rounded border border-slate-600/45 bg-slate-950/85 px-1.5 text-xs font-bold text-slate-100 outline-none focus:border-cyan-300 disabled:opacity-55"
              disabled={!canEdit}
              value={value.weaponRefinement}
              onChange={(event) => {
                playClickSound();
                onChange(team, pick.characterId, { weaponRefinement: Number(event.target.value) });
              }}
            >
              {[1, 2, 3, 4, 5].map((level) => (
                <option key={level} value={level}>R{level}</option>
              ))}
            </select>
            <p className="mt-1 truncate text-center text-[10px] font-black text-slate-100" title={weaponName}>{weaponName}</p>
          </div>
        ) : (
          <p className="truncate border-t border-slate-700/45 bg-slate-950/85 px-1.5 py-1 text-center text-[10px] font-black text-slate-400">
            Chọn vũ khí
          </p>
        )}
      </div>
    </div>
  );
}

function WeaponPickerModal({
  target,
  weapons,
  costCatalog,
  onClose,
  onClear,
  onSelect,
}: {
  target: NonNullable<WeaponPickerTarget>;
  weapons: WeaponItem[];
  costCatalog: CostCatalog;
  onClose: () => void;
  onClear: () => void;
  onSelect: (weapon: WeaponItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState<"ALL" | "5" | "4">("ALL");

  const visibleWeapons = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return weapons.filter((weapon) => {
      if (rarity !== "ALL" && weapon.rarity !== Number(rarity)) return false;
      if (!normalizedQuery) return true;
      return (
        weapon.name.toLowerCase().includes(normalizedQuery) ||
        weapon.type.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query, rarity, weapons]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/78 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl overflow-hidden rounded-lg border border-slate-500/30 bg-slate-950/96 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/50 px-4 py-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">
              {TEAM_COPY[target.team].label}
            </p>
            <h2 className="text-base font-black text-slate-100">{target.characterName}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="h-9 rounded-md border border-slate-600/50 px-3 text-xs font-black uppercase text-slate-300 transition hover:border-slate-300"
              onClick={() => {
                playClickSound();
                onClear();
              }}
              type="button"
            >
              Bỏ chọn
            </button>
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-600/50 text-slate-300 transition hover:border-rose-300 hover:text-rose-200"
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

        <div className="grid gap-3 border-b border-slate-700/40 p-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              className="h-10 w-full rounded-md border border-slate-700/60 bg-slate-900/70 pl-9 pr-3 text-sm font-semibold text-slate-100 outline-none focus:border-cyan-300"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm vũ khí..."
              value={query}
            />
          </div>
          <div className="grid grid-cols-3 overflow-hidden rounded-md border border-slate-700/60">
            {(["ALL", "5", "4"] as const).map((option) => (
              <button
                className={`h-10 px-4 text-xs font-black uppercase transition ${
                  rarity === option
                    ? option === "5"
                      ? "bg-amber-500/20 text-amber-100"
                      : option === "4"
                        ? "bg-purple-500/20 text-purple-100"
                        : "bg-cyan-500/18 text-cyan-100"
                    : "bg-slate-900/45 text-slate-400 hover:text-slate-100"
                }`}
                key={option}
                onClick={() => {
                  playClickSound();
                  setRarity(option);
                }}
                type="button"
              >
                {option === "ALL" ? "Tất cả" : `${option} sao`}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[66vh] overflow-y-auto p-4">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {visibleWeapons.map((weapon) => {
              const weaponCost = getWeaponCost(costCatalog, weapon);
              return (
                <button
                  className={`group overflow-hidden rounded-md border bg-slate-900/60 text-left transition hover:-translate-y-0.5 hover:bg-slate-900 ${
                    weapon.rarity === 5
                      ? "border-amber-400/45 hover:border-amber-300"
                      : "border-purple-400/35 hover:border-purple-300"
                  }`}
                  key={weapon.id}
                  onClick={() => {
                    playClickSound();
                    onSelect(weapon);
                  }}
                  type="button"
                >
                  <div className="relative aspect-square bg-slate-950/50">
                    <Image src={weapon.iconUrl} alt={weapon.name} fill sizes="120px" className="object-contain p-3" unoptimized />
                    <span className={`absolute right-1 top-1 rounded bg-slate-950/88 px-1.5 py-0.5 text-[10px] font-black ${
                      weapon.rarity === 5 ? "text-amber-200" : "text-purple-200"
                    }`}>
                      {weapon.rarity}★
                    </span>
                    <span className="absolute left-1 top-1 rounded bg-slate-950/88 px-1.5 py-0.5 text-[10px] font-black text-cyan-100">
                      Cost {formatCost(weaponCost)}
                    </span>
                  </div>
                  <div className="space-y-1 px-2 py-2">
                    <p className="truncate text-[11px] font-black text-slate-100" title={weapon.name}>
                      {weapon.name}
                    </p>
                    <p className="truncate text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      {weapon.type}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          {visibleWeapons.length === 0 && (
            <p className="py-12 text-center text-sm font-bold text-slate-500">Không có vũ khí phù hợp</p>
          )}
        </div>
      </div>
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
  characters: GenshinCharacter[];
  weapons: WeaponItem[];
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

  function updateCharacterCost(character: GenshinCharacter, patch: { baseCost?: number; constellationCost?: number }) {
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

  function updateWeaponCost(weapon: WeaponItem, cost: number) {
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
          <CatalogNumberField
            label="Mốc 4 sao"
            value={draft.defaults.character.rarity4Base}
            onChange={(value) => setDraft((previous) => ({
              ...previous,
              defaults: { ...previous.defaults, character: { ...previous.defaults.character, rarity4Base: value } },
            }))}
          />
          <CatalogNumberField
            label="Mốc 5 sao"
            value={draft.defaults.character.rarity5Base}
            onChange={(value) => setDraft((previous) => ({
              ...previous,
              defaults: { ...previous.defaults, character: { ...previous.defaults.character, rarity5Base: value } },
            }))}
          />
          <CatalogNumberField
            label="Cost mỗi cung"
            value={draft.defaults.character.constellationCost}
            onChange={(value) => setDraft((previous) => ({
              ...previous,
              defaults: { ...previous.defaults, character: { ...previous.defaults.character, constellationCost: value } },
            }))}
          />
          <CatalogNumberField
            label="Vũ khí 4 sao"
            value={draft.defaults.weapon.rarity4}
            onChange={(value) => setDraft((previous) => ({
              ...previous,
              defaults: { ...previous.defaults, weapon: { ...previous.defaults.weapon, rarity4: value } },
            }))}
          />
          <CatalogNumberField
            label="Vũ khí 5 sao"
            value={draft.defaults.weapon.rarity5}
            onChange={(value) => setDraft((previous) => ({
              ...previous,
              defaults: { ...previous.defaults, weapon: { ...previous.defaults.weapon, rarity5: value } },
            }))}
          />
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
                      <p className={`text-[10px] font-black ${character.rarity === 5 ? "text-amber-300" : "text-purple-300"}`}>
                        {character.rarity}★
                      </p>
                    </div>
                    <CatalogNumberField
                      label="Mốc"
                      value={rule?.baseCost ?? getCharacterBaseCost(catalog, character)}
                      onChange={(value) => updateCharacterCost(character, { baseCost: value })}
                    />
                    <CatalogNumberField
                      label="Mỗi cung"
                      value={rule?.constellationCost ?? getCharacterConstellationCost(catalog, character)}
                      onChange={(value) => updateCharacterCost(character, { constellationCost: value })}
                    />
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
                      <p className="truncate text-[10px] font-bold uppercase text-slate-500">
                        {weapon.type} · {weapon.rarity}★
                      </p>
                    </div>
                    <CatalogNumberField
                      label="Cost"
                      value={rule?.cost ?? getWeaponCost(catalog, weapon)}
                      onChange={(value) => updateWeaponCost(weapon, value)}
                    />
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

function CatalogNumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
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

function CostPanel({
  tone,
  summary,
  timeAdjustment,
}: {
  tone: "blue" | "red";
  summary: TeamSummary;
  timeAdjustment: TimeAdjustment;
}) {
  const timeTone = timeAdjustment.mode === "FASTER" ? "red" : timeAdjustment.mode === "SLOWER" ? "gold" : undefined;
  const timeLabel = timeAdjustment.mode === "FASTER" ? "Phải nhanh hơn" : timeAdjustment.mode === "SLOWER" ? "Được chậm hơn" : "Cân bằng";
  const timeValue = timeAdjustment.seconds === 0 ? "0s" : `${timeAdjustment.seconds.toFixed(0)}s`;

  return (
    <aside className={`self-start rounded-lg border bg-slate-950/48 p-4 ${panelBorder(tone)}`}>
      <h2 className={`text-sm font-black uppercase tracking-wide ${toneText(tone)}`}>
        Cost {tone === "blue" ? "Đội Xanh" : "Đội Đỏ"}
      </h2>
      <div className="mt-4 space-y-3">
        <CostRow label="Tổng cost" value={formatCost(summary.total)} strong tone={tone} />
        <CostRow label="Cost mốc" value={formatCost(summary.milestoneCost)} />
        <CostRow label="Cung mệnh" value={formatCost(summary.consCost)} />
        <CostRow label="Vũ khí" value={formatCost(summary.weaponCost)} />
        <CostRow label="Cấp" value="0.00s" />
        <CostRow label="Cost đặc biệt" value="0" />
        <CostRow label={timeLabel} value={timeValue} strong tone={timeTone} />
      </div>
    </aside>
  );
}

function CostRow({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "blue" | "red" | "gold";
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="font-bold text-slate-200">{label}:</span>
      <span className={`font-black tabular-nums ${strong ? rowText(tone) : "text-slate-300"}`}>{value}</span>
    </div>
  );
}

function PlayerPlate({
  tone,
  name,
  uid,
  nickname,
  avatarUrl,
}: {
  tone: "blue" | "red";
  name: string | null;
  uid: string | null;
  nickname: string | null;
  avatarUrl: string | null;
}) {
  const displayName = nickname ?? name ?? "Player";

  return (
    <div className={`flex items-center gap-3 ${tone === "red" ? "justify-end text-right" : ""}`}>
      {tone === "blue" && <Avatar avatarUrl={avatarUrl} name={displayName} />}
      <div className="min-w-0">
        <p className={`truncate text-sm font-black ${toneText(tone)}`}>{displayName}</p>
        <p className="text-[11px] font-bold text-slate-100">UID: {uid ?? "N/A"}</p>
        {name && name !== displayName && <p className="truncate text-[11px] text-slate-400">{name}</p>}
      </div>
      {tone === "red" && <Avatar avatarUrl={avatarUrl} name={displayName} />}
    </div>
  );
}

function Avatar({ avatarUrl, name }: { avatarUrl: string | null; name: string }) {
  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-slate-500/40 bg-slate-900">
      {avatarUrl ? (
        <Image src={avatarUrl} alt={name} fill sizes="56px" className="object-cover" unoptimized />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-black text-slate-300">
          {name.slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>
  );
}

function CenterLead({ lead, costPerPoint }: { lead: ReturnType<typeof calculateLead>; costPerPoint: number }) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="rounded-2xl border border-cyan-300/45 bg-slate-950/58 px-5 py-4 shadow-[0_0_32px_rgba(34,211,238,0.16)]">
        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Điều chỉnh thời gian trực tiếp</p>
        <div className="mt-3 grid gap-2 text-left text-xs font-black uppercase tracking-wide">
          <TimeAdjustmentRow tone="blue" label="Đội Xanh" adjustment={lead.blue} />
          <TimeAdjustmentRow tone="red" label="Đội Đỏ" adjustment={lead.red} />
        </div>
        <p className="mt-3 text-[10px] font-bold text-slate-500">
          Công thức: chênh lệch cost × {costPerPoint}s/cost
        </p>
      </div>
      <p className="mt-2 text-[11px] font-black uppercase tracking-wide text-slate-400">Cập nhật khi hai đội lưu build song song</p>
    </div>
  );
}

function TimeAdjustmentRow({ tone, label, adjustment }: { tone: "blue" | "red"; label: string; adjustment: TimeAdjustment }) {
  const valueTone = adjustment.mode === "FASTER"
    ? "text-rose-300"
    : adjustment.mode === "SLOWER"
      ? "text-amber-300"
      : "text-slate-300";
  return (
    <div className="flex min-w-[190px] items-center justify-between gap-3 rounded-lg border border-slate-700/40 bg-slate-900/45 px-3 py-2">
      <span className={toneText(tone)}>{label}</span>
      <span className={valueTone}>{adjustment.label}</span>
    </div>
  );
}

function seedBuildValues(
  team: TeamSide,
  picks: NamedPick[],
  existingBuilds: ExistingBuild[],
  characterMap: Map<string, GenshinCharacter>,
  weapons: WeaponItem[],
  costCatalog: CostCatalog,
): Record<string, BuildValue> {
  const existingByCharacter = new Map(
    existingBuilds
      .filter((build) => build.player === team)
      .map((build) => [build.characterId, build]),
  );

  return Object.fromEntries(
    picks.map((pick) => {
      const existing = existingByCharacter.get(pick.characterId);
      const snapshot = existing ? parseWeaponSnapshot(existing.enkaSnapshot) : null;
      const selectedWeapon = snapshot?.weaponId ? weapons.find((weapon) => weapon.id === snapshot.weaponId) : null;
      return [
        pick.characterId,
        existing
          ? withCalculatedCost({
              characterId: existing.characterId,
              rarity: existing.rarity,
              consLevel: existing.consLevel,
              weaponRarity: existing.weaponRarity,
              weaponRefinement: snapshot?.weaponRefinement ?? 1,
              weaponId: snapshot?.weaponId ?? null,
              weaponName: snapshot?.weaponName ?? selectedWeapon?.name ?? null,
              weaponIconUrl: snapshot?.weaponIconUrl ?? selectedWeapon?.iconUrl ?? null,
              weaponType: snapshot?.weaponType ?? selectedWeapon?.type ?? null,
              characterBaseCost: 0,
              constellationCost: 0,
              weaponCost: 0,
              totalCost: existing.totalCost,
            }, costCatalog)
          : defaultBuild(pick.characterId, characterMap, costCatalog),
      ];
    }),
  );
}

function isSavedBuild(build: ExistingBuild): boolean {
  return build.source !== "PREVIEW";
}

function mergeBuildLists(savedBuilds: ExistingBuild[], previewBuilds: ExistingBuild[]): ExistingBuild[] {
  if (previewBuilds.length === 0) return savedBuilds;

  let merged = savedBuilds;
  for (const preview of previewBuilds) {
    merged = merged.filter((build) => build.player !== preview.player || build.characterId !== preview.characterId);
    merged = [...merged, { ...preview, source: "PREVIEW" }];
  }
  return merged;
}

function defaultBuild(characterId: string, characterMap: Map<string, GenshinCharacter>, costCatalog: CostCatalog): BuildValue {
  const rarity = characterMap.get(characterId)?.rarity ?? 5;
  return withCalculatedCost({
    characterId,
    rarity,
    consLevel: 0,
    weaponRarity: 4,
    weaponRefinement: 1,
    weaponId: null,
    weaponName: null,
    weaponIconUrl: null,
    weaponType: null,
    characterBaseCost: 0,
    constellationCost: 0,
    weaponCost: 0,
    totalCost: 0,
  }, costCatalog);
}

function buildPreviewPayload(
  team: TeamSide,
  picks: NamedPick[],
  values: Record<string, BuildValue>,
  characterMap: Map<string, GenshinCharacter>,
  costCatalog: CostCatalog,
) {
  return picks.map((pick) => {
    const build = values[pick.characterId] ?? defaultBuild(pick.characterId, characterMap, costCatalog);
    return {
      player: team,
      characterId: pick.characterId,
      rarity: build.rarity,
      consLevel: build.consLevel,
      weaponRarity: build.weaponRarity,
      totalCost: build.totalCost,
      source: "PREVIEW",
      enkaSnapshot: {
        weaponId: build.weaponId,
        weaponName: build.weaponName,
        weaponIconUrl: build.weaponIconUrl,
        weaponType: build.weaponType,
        weaponRefinement: build.weaponRefinement,
        characterBaseCost: build.characterBaseCost,
        constellationCost: build.constellationCost,
        weaponCost: build.weaponCost,
        totalCost: build.totalCost,
      },
    };
  });
}

function summarizeTeam(
  team: TeamSide,
  picks: NamedPick[],
  values: Record<string, BuildValue>,
  existingBuilds: ExistingBuild[],
  characterMap: Map<string, GenshinCharacter>,
  costCatalog: CostCatalog,
): TeamSummary {
  let milestoneCost = 0;
  let consCost = 0;
  let weaponCost = 0;
  let total = 0;

  for (const pick of picks) {
    const build = values[pick.characterId] ?? defaultBuild(pick.characterId, characterMap, costCatalog);
    milestoneCost += build.characterBaseCost;
    consCost += build.constellationCost;
    weaponCost += build.weaponCost;
    total += build.totalCost;
  }

  return {
    total,
    milestoneCost,
    consCost,
    weaponCost,
    submitted: existingBuilds.filter((build) => build.player === team).length,
  };
}

function withCalculatedCost(value: BuildValue, costCatalog: CostCatalog): BuildValue {
  const cost = calculateBuildCost(costCatalog, {
    characterId: value.characterId,
    characterRarity: value.rarity,
    consLevel: value.consLevel,
    weaponId: value.weaponId,
    weaponRarity: value.weaponRarity,
    weaponRefinement: value.weaponRefinement,
  });

  return {
    ...value,
    characterBaseCost: cost.characterBaseCost,
    constellationCost: cost.constellationCost,
    weaponCost: cost.weaponCost,
    totalCost: cost.totalCost,
  };
}

function getWeaponCost(costCatalog: CostCatalog, weapon: WeaponItem): number {
  const ruleCost = costCatalog.weapons[weapon.id]?.cost;
  if (typeof ruleCost === "number" && Number.isFinite(ruleCost)) {
    return ruleCost;
  }
  return weapon.rarity === 5 ? costCatalog.defaults.weapon.rarity5 : costCatalog.defaults.weapon.rarity4;
}

function getCharacterBaseCost(costCatalog: CostCatalog, character: GenshinCharacter): number {
  const ruleCost = costCatalog.characters[character.id]?.baseCost;
  if (typeof ruleCost === "number" && Number.isFinite(ruleCost)) {
    return ruleCost;
  }
  return character.rarity === 5 ? costCatalog.defaults.character.rarity5Base : costCatalog.defaults.character.rarity4Base;
}

function getCharacterConstellationCost(costCatalog: CostCatalog, character: GenshinCharacter): number {
  const ruleCost = costCatalog.characters[character.id]?.constellationCost;
  if (typeof ruleCost === "number" && Number.isFinite(ruleCost)) {
    return ruleCost;
  }
  return character.rarity === 5 ? costCatalog.defaults.character.constellationCost : 0;
}

function buildEditableCostCatalog(catalog: CostCatalog, characters: GenshinCharacter[], weapons: WeaponItem[]): CostCatalog {
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

function formatCost(value: number): string {
  return value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

function parseWeaponSnapshot(snapshot: unknown): Pick<BuildValue, "weaponId" | "weaponName" | "weaponIconUrl" | "weaponType" | "weaponRefinement"> | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const record = snapshot as Record<string, unknown>;
  const refinement = Number(record.weaponRefinement);
  return {
    weaponId: typeof record.weaponId === "string" ? record.weaponId : null,
    weaponName: typeof record.weaponName === "string" ? record.weaponName : null,
    weaponIconUrl: typeof record.weaponIconUrl === "string" ? record.weaponIconUrl : null,
    weaponType: typeof record.weaponType === "string" ? record.weaponType : null,
    weaponRefinement: Number.isInteger(refinement) && refinement >= 1 && refinement <= 5 ? refinement : 1,
  };
}

function calculateLead(blueCost: number, redCost: number, costPerPoint: number) {
  const diffSeconds = Math.abs(blueCost - redCost) * costPerPoint;
  const even: TimeAdjustment = { mode: "EVEN", seconds: 0, label: "Cân bằng" };
  if (diffSeconds === 0) {
    return {
      blue: even,
      red: even,
      tone: "blue" as const,
    };
  }

  const slower = (seconds: number): TimeAdjustment => ({
    mode: "SLOWER",
    seconds,
    label: `Được chậm hơn ${seconds.toFixed(0)}s`,
  });
  const faster = (seconds: number): TimeAdjustment => ({
    mode: "FASTER",
    seconds,
    label: `Phải nhanh hơn ${seconds.toFixed(0)}s`,
  });

  if (blueCost < redCost) {
    return {
      blue: slower(diffSeconds),
      red: faster(diffSeconds),
      tone: "blue" as const,
    };
  }

  return {
    blue: faster(diffSeconds),
    red: slower(diffSeconds),
    tone: "red" as const,
  };
}

function panelBorder(tone: "blue" | "red") {
  return tone === "blue" ? "border-cyan-500/35" : "border-rose-500/35";
}

function toneText(tone: "blue" | "red") {
  return tone === "blue" ? "text-cyan-300" : "text-rose-300";
}

function rowText(tone?: "blue" | "red" | "gold") {
  if (tone === "red") return "text-rose-300";
  if (tone === "gold") return "text-amber-300";
  return "text-cyan-300";
}
