import { NextResponse } from "next/server";
import { services } from "@/composition/services";

export async function getCurrentUserRecord() {
  return services.auth.getCurrentUserRecord();
}

export async function requireAdmin() {
  const result = await services.auth.requireAdmin();
  if (!result.ok) {
    return { error: NextResponse.json({ message: result.message }, { status: result.status }), user: null };
  }
  return { error: null, user: result.data };
}

export async function requireUser() {
  const result = await services.auth.requireUser();
  if (!result.ok) {
    return { error: NextResponse.json({ message: result.message }, { status: result.status }), user: null };
  }
  return { error: null, user: result.data };
}

export async function requireRoomMember(roomCode: string, clientId: string) {
  const result = await services.room.requireRoomMember(roomCode, clientId);
  if (!result.ok) {
    return {
      error: NextResponse.json({ message: result.message }, { status: result.status }),
      room: null,
      role: null,
      team: null,
    };
  }

  return {
    error: null,
    room: result.data.room,
    role: result.data.role,
    team: result.data.team,
  };
}
