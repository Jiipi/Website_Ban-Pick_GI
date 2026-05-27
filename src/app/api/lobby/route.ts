import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return jsonResult(await services.lobby.register(body));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return jsonResult(await services.lobby.listOnline(searchParams.get("uid")));
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => ({}));
  return jsonResult(await services.lobby.leave(body));
}
