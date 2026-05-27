import { NextResponse } from "next/server";
import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";
import { setClientIdCookie } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = {
  params: Promise<{ code: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const { code } = await params;
  const body = await request.json().catch(() => ({}));
  const result = await services.room.joinRoom(code, body);
  if (!result.ok) return jsonResult(result);
  return setClientIdCookie(NextResponse.json(result.data), result.data.clientId);
}

export async function DELETE(request: Request, { params }: Params) {
  const { code } = await params;
  const body = await request.json().catch(() => ({}));
  return jsonResult(await services.room.leaveRoom(code, body));
}
