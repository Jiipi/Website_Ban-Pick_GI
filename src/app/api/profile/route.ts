import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function readClientIdFromRequest(request: Request, fromQuery?: string): string {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieClientId = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("bp_client_id="))
    ?.slice("bp_client_id=".length);
  return (fromQuery ?? "") || cookieClientId || "";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = readClientIdFromRequest(request, searchParams.get("clientId") ?? "");
  return jsonResult(await services.profile.getProfile(clientId));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const fromCookie = readClientIdFromRequest(request);
  const clientId = (typeof body.clientId === "string" && body.clientId.trim()) || fromCookie;
  return jsonResult(await services.profile.updateProfile(clientId, body));
}
