import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomCode = searchParams.get("roomCode")?.toUpperCase() ?? null;
  const clientId = searchParams.get("clientId") ?? "";
  return jsonResult(await services.chat.getMessages(roomCode, clientId));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return jsonResult(await services.chat.sendMessage(body));
}
