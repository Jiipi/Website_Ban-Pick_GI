import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { services } from "@/composition/services";
import { SESSION_KEYS } from "@/domain/common/constants";
import { jsonResult } from "@/presentation/http/respond";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const result = services.session.initClientSession(body);
  if (!result.ok) return jsonResult(result);

  const store = await cookies();
  store.set(SESSION_KEYS.clientId, result.data.clientId, result.data.cookie);

  return NextResponse.json({ clientId: result.data.clientId });
}

export async function GET() {
  const store = await cookies();
  const clientId = store.get(SESSION_KEYS.clientId)?.value ?? null;
  return NextResponse.json({ clientId });
}
