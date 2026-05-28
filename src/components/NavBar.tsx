"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PhaseIndicator } from "./PhaseIndicator";
import type { Phase } from "./PhaseIndicator";

type NavBarProps = {
  roomCode?: string;
  phase?: Phase;
};

export function NavBar({ roomCode, phase }: NavBarProps) {
  const pathname = usePathname() ?? "";

  if (roomCode && phase) {
    return (
      <header className="sticky top-0 z-50 flex h-12 items-center justify-between border-b border-slate-800/40 bg-slate-950/70 px-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm font-black tracking-tight text-slate-100 hover:text-cyan-300 transition-colors"
          >
            Genshin Draft
          </Link>
          <span className="text-slate-600">/</span>
          <span className="font-mono text-xs font-bold tracking-wider text-cyan-300">{roomCode}</span>
        </div>
        <div className="flex items-center gap-1">
          <PhaseIndicator current={phase} roomCode={roomCode} />
        </div>
      </header>
    );
  }

  if (pathname.startsWith("/room/")) return null;
  return null;
}

