"use client";

import { SESSION_KEYS } from "./constants";
import type { Session, TeamSide, UserRole } from "./types";
import { isTeamSide, isUserRole } from "./types";

function generateClientId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `c_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

// Sync clientId to httpOnly cookie so Server Components can read it.
// Callers that navigate immediately after creating a session should await this.
export async function syncClientIdCookie(clientId: string): Promise<void> {
  try {
    await fetch("/api/session/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    });
  } catch {
    // best-effort
  }
}

// Each tab is an independent session (sessionStorage is per-tab).
// This allows opening multiple tabs as different roles/players.
const store = () => (typeof window === "undefined" ? null : window.sessionStorage);

let cookieSynced = false;

export function getOrCreateClientId(): string {
  const s = store();
  if (!s) return "";
  const existing = s.getItem(SESSION_KEYS.clientId);
  if (existing) {
    if (!cookieSynced) {
      cookieSynced = true;
      void syncClientIdCookie(existing);
    }
    return existing;
  }
  const fresh = generateClientId();
  s.setItem(SESSION_KEYS.clientId, fresh);
  cookieSynced = true;
  void syncClientIdCookie(fresh);
  return fresh;
}

export function getSession(roomCode: string): Session | null {
  const s = store();
  if (!s) return null;
  const clientId = s.getItem(SESSION_KEYS.clientId);
  const name = s.getItem(SESSION_KEYS.name);
  const role = s.getItem(SESSION_KEYS.role);
  const team = s.getItem(SESSION_KEYS.team);
  const savedRoom = s.getItem(SESSION_KEYS.roomCode);

  if (!clientId || !name || !role) return null;
  if (savedRoom && savedRoom !== roomCode) return null;
  if (!isUserRole(role)) return null;

  return {
    clientId,
    name,
    role,
    team: isTeamSide(team) ? team : null,
  };
}

export function setSession(roomCode: string, partial: { name: string; role: UserRole; team?: TeamSide | null }): Session {
  const s = store();
  const clientId = getOrCreateClientId();
  if (!s) return { clientId, name: partial.name, role: partial.role, team: partial.team ?? null };

  s.setItem(SESSION_KEYS.name, partial.name);
  s.setItem(SESSION_KEYS.role, partial.role);
  s.setItem(SESSION_KEYS.roomCode, roomCode);
  if (partial.team) {
    s.setItem(SESSION_KEYS.team, partial.team);
  } else {
    s.removeItem(SESSION_KEYS.team);
  }
  return { clientId, name: partial.name, role: partial.role, team: partial.team ?? null };
}

export function clearSession(): void {
  const s = store();
  if (!s) return;
  s.removeItem(SESSION_KEYS.name);
  s.removeItem(SESSION_KEYS.role);
  s.removeItem(SESSION_KEYS.team);
  s.removeItem(SESSION_KEYS.roomCode);
}
