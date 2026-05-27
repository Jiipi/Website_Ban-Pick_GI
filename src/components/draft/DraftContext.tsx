"use client";

import { createContext, useContext } from "react";
import type { DraftEntry, DraftTurn } from "@/lib/draft";
import type { GenshinCharacter } from "@/lib/genshin";
import type { Session, TeamSide } from "@/lib/types";

export type PlayerInfo = {
  name: string | null;
  uid: string | null;
  nickname: string | null;
  avatarUrl: string | null;
};

export type DraftContextValue = {
  roomCode: string;
  status: string;
  hostClientId: string | null;
  blueClientId: string | null;
  redClientId: string | null;
  hostName: string | null;
  blue: PlayerInfo;
  red: PlayerInfo;
  session: Session | null;
  currentTurn: DraftTurn | null;
  logs: DraftEntry[];
  characters: GenshinCharacter[];
  characterMap: Map<string, GenshinCharacter>;
  ownedTeam: TeamSide | null;
  userIsHost: boolean;
  canAct: boolean;
  draftDone: boolean;
  stepNumber: number;
  totalTurns: number;
  activeTeam: TeamSide | null;
  activeAction: "BAN" | "PICK" | null;
  bansBlue: DraftEntry[];
  bansRed: DraftEntry[];
  picksBlue: DraftEntry[];
  picksRed: DraftEntry[];
  blueTaken: boolean;
  redTaken: boolean;
  buildCount: number;
};

const DraftContext = createContext<DraftContextValue | null>(null);

export function useDraft() {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error("useDraft must be used within DraftProvider");
  return ctx;
}

export function DraftProvider({
  value,
  children,
}: {
  value: DraftContextValue;
  children: React.ReactNode;
}) {
  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}
