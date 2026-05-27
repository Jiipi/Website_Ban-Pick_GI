import { NextResponse } from "next/server";
import { roomAccessPolicy, type RoomAccessShape } from "@/domain/room/RoomAccessPolicy";
import type { ChatRole, TeamSide, UserRole } from "@/domain/common/types";
import { isTeamSide } from "@/domain/common/types";

type RoomLike = RoomAccessShape;

export function readClientId(body: Record<string, unknown>): string {
  const id = body.clientId;
  if (typeof id !== "string" || id.trim().length === 0) return "";
  return id.trim();
}

export function resolveRole(room: RoomLike, clientId: string): { role: UserRole | null; team: TeamSide | null } {
  return roomAccessPolicy.resolveRole(room, clientId);
}

export function chatRoleFromSession(room: RoomLike, clientId: string): ChatRole | null {
  return roomAccessPolicy.chatRoleFromSession(room, clientId);
}

export function ensureClientId(body: Record<string, unknown>) {
  const clientId = readClientId(body);
  if (!clientId) {
    return { error: NextResponse.json({ message: "Missing clientId" }, { status: 400 }), clientId: "" as const };
  }
  return { error: null, clientId };
}

export function ensureTeam(value: unknown) {
  if (!isTeamSide(value)) {
    return { error: NextResponse.json({ message: "Invalid team" }, { status: 400 }), team: null as TeamSide | null };
  }
  return { error: null, team: value };
}

export function generateClientId(): string {
  return globalThis.crypto.randomUUID();
}

const CLIENT_ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function setClientIdCookie(response: NextResponse, clientId: string): NextResponse {
  response.cookies.set("bp_client_id", clientId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CLIENT_ID_COOKIE_MAX_AGE,
  });
  return response;
}
