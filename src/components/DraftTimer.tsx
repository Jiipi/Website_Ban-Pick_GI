"use client";

import { useEffect, useState, useRef } from "react";
import { getSynchronizedTime } from "@/lib/timeSync";
import { playTimerTickSound, playBankTimeWarning } from "@/lib/sounds";

type DraftTimerProps = {
  /** Seconds per turn */
  duration: number;
  /** ISO timestamp string or Date object when the current turn started */
  turnStartedAt: string | Date;
  /** Whether the timer is active */
  active: boolean;
  /** Callback when time runs out (turn + bank) */
  onTimeout?: () => void;
  /** Size of the ring in px */
  size?: number;
  /** Bank time remaining for the active team (seconds) */
  bankTime?: number;
  /** Which team is active */
  activeTeam?: "BLUE" | "RED" | null;
};

export function DraftTimer({
  duration,
  turnStartedAt,
  active,
  onTimeout,
  size = 96,
  bankTime = 0,
  activeTeam,
}: DraftTimerProps) {
  const [remaining, setRemaining] = useState(duration);
  const [bankRemaining, setBankRemaining] = useState(bankTime);
  const [isInBankTime, setIsInBankTime] = useState(false);
  const lastTickRef = useRef(-1);
  const bankWarningPlayedRef = useRef(false);

  // Reset bank warning flag when turn changes
  useEffect(() => {
    bankWarningPlayedRef.current = false;
    lastTickRef.current = -1;
  }, [turnStartedAt]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setBankRemaining(bankTime);
    });
    return () => {
      cancelled = true;
    };
  }, [bankTime]);

  useEffect(() => {
    if (!active) {
      queueMicrotask(() => setIsInBankTime(false));
      return;
    }

    const updateTimer = () => {
      const start = new Date(turnStartedAt).getTime();
      const now = getSynchronizedTime();
      const elapsedMs = now - start;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      const turnRem = Math.max(0, duration - elapsedSec);

      if (turnRem > 0) {
        // Still in turn time
        setIsInBankTime(false);
        setRemaining((prev) => {
          if (prev !== turnRem) {
            return turnRem;
          }
          return prev;
        });
        setBankRemaining(bankTime);
      } else {
        // Turn time expired — consuming bank time
        const overtimeSec = elapsedSec - duration;
        const bankRem = Math.max(0, bankTime - overtimeSec);

        setIsInBankTime(true);
        setRemaining(0);

        // Play bank time warning sound on first entry
        if (!bankWarningPlayedRef.current) {
          bankWarningPlayedRef.current = true;
          playBankTimeWarning();
        }

        // Play tick sound for countdown 5-4-3-2-1
        if (bankRem <= 5 && bankRem > 0 && bankRem !== lastTickRef.current) {
          lastTickRef.current = bankRem;
          playTimerTickSound();
        }

        setBankRemaining((prev) => {
          if (prev !== bankRem) {
            if (bankRem <= 0 && prev > 0) {
              onTimeout?.();
            }
            return bankRem;
          }
          return prev;
        });
      }
    };

    queueMicrotask(updateTimer);
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [active, duration, turnStartedAt, onTimeout, bankTime]);

  const displayRemaining = active ? (isInBankTime ? bankRemaining : remaining) : duration;
  const totalTime = isInBankTime ? bankTime : duration;
  const fraction = totalTime > 0 ? displayRemaining / totalTime : 0;
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - fraction);

  // Color logic: cyan → amber → red → gold (bank time)
  const strokeColor = isInBankTime
    ? (displayRemaining <= 5 ? "#ef4444" : "#f59e0b")
    : (displayRemaining <= 5 ? "#ef4444" : displayRemaining <= 15 ? "#f59e0b" : "#22d3ee");

  const statusClass = isInBankTime
    ? "bank-time"
    : (displayRemaining <= 5 ? "critical" : displayRemaining <= 15 ? "warning" : "");

  const minutes = Math.floor(displayRemaining / 60);
  const seconds = displayRemaining % 60;
  const label = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div
      className={`timer-ring ${statusClass}`}
      style={{ width: size, height: size }}
      role="timer"
      aria-live={displayRemaining <= 15 ? "assertive" : "off"}
      aria-label={`${isInBankTime ? "Bank time" : "Turn timer"}: ${minutes} minutes ${seconds} seconds remaining`}
    >
      <svg width={size} height={size}>
        <circle
          className="timer-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={3}
        />
        <circle
          className="timer-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={isInBankTime ? 4 : 3}
          stroke={strokeColor}
          strokeDasharray={circumference}
          strokeDashoffset={strokeOffset}
        />
      </svg>
      <div className="timer-text-group">
        <span className="timer-text" style={{ color: strokeColor }}>
          {label}
        </span>
        {isInBankTime && (
          <span className="timer-bank-label" style={{ color: strokeColor }}>
            BANK
          </span>
        )}
      </div>
    </div>
  );
}
