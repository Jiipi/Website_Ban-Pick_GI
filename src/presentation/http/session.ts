import { services } from "@/composition/services";

/**
 * Read the bp_client_id cookie from the request headers.
 */
export function readClientIdFromRequest(request: Request): string {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieClientId = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("bp_client_id="))
    ?.slice("bp_client_id=".length);
  return cookieClientId ?? "";
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
