import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";
import { readBearerToken } from "@/presentation/http/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return jsonResult(await services.lobby.register(body, readBearerToken(request)));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return jsonResult(await services.lobby.listOnline(searchParams.get("uid"), readBearerToken(request)));
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => ({}));
  return jsonResult(await services.lobby.leave(body));
}
