import { services } from "@/composition/services";

/**
 * Read the bp_client_id cookie from the request headers.
 */
export function readClientIdFromRequest(request: Request): string {
  const headerClientId = request.headers.get("x-bp-client-id")?.trim();
  if (headerClientId) return headerClientId;

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieClientId = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("bp_client_id="))
    ?.slice("bp_client_id=".length);
  return cookieClientId ?? "";
}

export function readBearerToken(request: Request): string | null {
  const value = request.headers.get("authorization") ?? "";
  const [scheme, token] = value.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token?.trim()) return null;
  return token.trim();
}

/**
 * Resolve the current user UID from the lobby player tied to the bp_client_id cookie.
 * Returns null if no clientId or no registered lobby player.
 */
export async function resolveCurrentUid(request: Request): Promise<{
  uid: string;
  nickname: string;
  avatarUrl: string | null;
} | null> {
  const clientId = readClientIdFromRequest(request);
  if (!clientId) return null;

  const result = await services.profile.getCurrentPlayer(clientId);
  if (!result.ok) return null;

  return {
    uid: result.data.uid,
    nickname: result.data.nickname,
    avatarUrl: result.data.avatarUrl,
  };
}
