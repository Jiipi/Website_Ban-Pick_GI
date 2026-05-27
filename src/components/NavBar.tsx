"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { PhaseIndicator } from "./PhaseIndicator";
import { NotificationBell } from "./NotificationBell";
import type { Phase } from "./PhaseIndicator";

type NavBarProps = {
  roomCode?: string;
  phase?: Phase;
};

const NAV_LINKS = [
  { href: "/tournaments", label: "Giải đấu" },
  { href: "/characters", label: "Tướng" },
  { href: "/meta", label: "Meta" },
  { href: "/weapons", label: "Vũ khí" },
  { href: "/leaderboard", label: "Xếp hạng" },
  { href: "/missions", label: "Nhiệm vụ" },
  { href: "/achievements", label: "Thành tựu" },
  { href: "/feed", label: "Bảng tin" },
  { href: "/archive", label: "Kho trận" },
  { href: "/friends", label: "Bạn bè" },
  { href: "/tools/cost-calculator", label: "Calculator" },
  { href: "/guide", label: "Guide" },
  { href: "/tutorial", label: "Hướng dẫn" },
  { href: "/history", label: "Lịch sử" },
  { href: "/settings", label: "Cài đặt" },
];

function triggerSearch() {
  if (typeof window === "undefined") return;
  const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true });
  window.dispatchEvent(event);
}

export function NavBar({ roomCode, phase }: NavBarProps) {
  const pathname = usePathname();

  // Don't render on pages that have their own immersive layout
  if (pathname.startsWith("/room/") && !phase) return null;
  if (pathname === "/") return null;

  return (
    <header className="sticky top-0 z-50 flex h-12 items-center justify-between border-b border-slate-800/40 bg-slate-950/70 px-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-sm font-black tracking-tight text-slate-100 hover:text-cyan-300 transition-colors">
          Genshin Draft
        </Link>
        {roomCode && (
          <>
            <span className="text-slate-600">/</span>
            <span className="font-mono text-xs font-bold tracking-wider text-cyan-300">{roomCode}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        {phase && roomCode && <PhaseIndicator current={phase} roomCode={roomCode} />}
        {!roomCode && (
          <>
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      active
                        ? "bg-cyan-500/10 text-cyan-300"
                        : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={triggerSearch}
              className="ml-1 hidden sm:flex items-center gap-2 rounded-lg border border-slate-700/40 bg-slate-900/40 px-2.5 py-1 text-[10px] font-medium text-slate-400 hover:border-slate-600 hover:text-slate-200 transition-colors"
              title="Tìm kiếm (Ctrl+K)"
            >
              <Search size={12} />
              <span>Tìm</span>
              <kbd className="rounded bg-slate-800/60 px-1 font-mono text-[9px]">Ctrl K</kbd>
            </button>
            <NotificationBell />
          </>
        )}
      </div>
    </header>
  );
}
