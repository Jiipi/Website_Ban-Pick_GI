import { NextResponse } from "next/server";
import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";
import { setClientIdCookie } from "@/lib/server-auth";
import { readBearerToken } from "@/presentation/http/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const auth = await services.auth.requireUser(readBearerToken(request));
    if (!auth.ok) return jsonResult(auth);

    const body = await request.json().catch(() => ({}));
    const result = await services.room.createRoom(body, auth.data);
    if (!result.ok) return jsonResult(result);

    return setClientIdCookie(NextResponse.json(result.data), result.data.clientId);
  } catch (err) {
    console.error("[POST /api/room]", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
