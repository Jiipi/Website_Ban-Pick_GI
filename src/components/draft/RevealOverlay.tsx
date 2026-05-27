"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { playBanSound, playPickSound } from "@/lib/sounds";

type RevealOverlayProps = {
  characterId: string;
  characterName: string;
  characterIconUrl: string;
  action: "BAN" | "PICK";
  team: "BLUE" | "RED";
  onComplete: () => void;
};

const PICK_DURATION = 1500; // 1.5s total
const BAN_DURATION = 1200;  // 1.2s total
const PICK_EXIT_START = 1100; // Start fade-out at 1.1s for pick
const BAN_EXIT_START = 900;   // Start fade-out at 0.9s for ban

export function RevealOverlay({
  characterId,
  characterName,
  characterIconUrl,
  action,
  team,
  onComplete,
}: RevealOverlayProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Play sound at start
    if (action === "BAN") {
      playBanSound();
    } else {
      playPickSound();
    }

    const isPick = action === "PICK";
    const exitStart = isPick ? PICK_EXIT_START : BAN_EXIT_START;
    const totalDuration = isPick ? PICK_DURATION : BAN_DURATION;

    // Start exit animation
    const exitTimer = setTimeout(() => setExiting(true), exitStart);
    // Auto-dismiss
    const completeTimer = setTimeout(onComplete, totalDuration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
    // Only run on mount — characterId is the identity key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId]);

  const isPick = action === "PICK";
  const exitClass = exiting
    ? isPick
      ? "reveal-overlay--exiting"
      : "reveal-overlay--ban-exiting"
    : "";

  if (isPick) {
    const glowClass = team === "BLUE" ? "reveal-glow-blue" : "reveal-glow-red";
    const nameClass = team === "BLUE" ? "reveal-name--blue" : "reveal-name--red";

    return (
      <div className={`reveal-overlay ${exitClass}`}>
        <div className="reveal-overlay-backdrop reveal-overlay-backdrop--pick" />
        <div className={`reveal-splash-pick ${glowClass}`}>
          <div className="reveal-art-container">
            <Image
              src={characterIconUrl}
              alt={characterName}
              fill
              sizes="50vw"
              unoptimized
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
          <div className={`reveal-name ${nameClass}`}>
            {characterName}
          </div>
        </div>
      </div>
    );
  }

  // Ban reveal
  return (
    <div className={`reveal-overlay ${exitClass}`}>
      <div className="reveal-overlay-backdrop reveal-overlay-backdrop--ban" />
      <div className="reveal-splash-ban">
        <div className="reveal-art-container">
          <Image
            src={characterIconUrl}
            alt={characterName}
            fill
            sizes="50vw"
            unoptimized
            style={{ objectFit: "contain" }}
            priority
          />
          <div className="reveal-ban-x" />
        </div>
        <div className="reveal-ban-text">BANNED</div>
      </div>
    </div>
  );
}
