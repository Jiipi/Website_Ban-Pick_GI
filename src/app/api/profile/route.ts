import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";
import { readBearerToken } from "@/presentation/http/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function readClientIdFromRequest(request: Request, fromQuery?: string): string {
  const headerClientId = request.headers.get("x-bp-client-id")?.trim();
  if (headerClientId && !fromQuery) return headerClientId;

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
  const accessToken = readBearerToken(request);
  const clientIdParam = searchParams.get("clientId") ?? "";
  if (!clientIdParam && accessToken) {
    const auth = await services.auth.requireUser(accessToken);
    if (!auth.ok) return jsonResult(auth);
    return jsonResult(await services.profile.getAccountProfile(auth.data));
  }

  const clientId = readClientIdFromRequest(request, clientIdParam);
  return jsonResult(await services.profile.getProfile(clientId));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const fromCookie = readClientIdFromRequest(request);
  const clientId = (typeof body.clientId === "string" && body.clientId.trim()) || fromCookie;
  const accessToken = readBearerToken(request);
  if (accessToken) {
    const auth = await services.auth.requireUser(accessToken);
    if (!auth.ok) return jsonResult(auth);
    return jsonResult(await services.profile.updateAccountProfile(auth.data, body, clientId));
  }
  return jsonResult(await services.profile.updateProfile(clientId, body));
}
