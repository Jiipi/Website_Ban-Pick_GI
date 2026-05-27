import { failure, success } from "@/application/shared/ServiceResult";

export const CLIENT_ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export class SessionService {
  initClientSession(payload: Record<string, unknown>) {
    const clientId = typeof payload.clientId === "string" ? payload.clientId.trim() : "";

    if (!clientId || clientId.length > 128) {
      return failure(400, "Invalid clientId");
    }

    return success({
      clientId,
      cookie: {
        httpOnly: true,
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: CLIENT_ID_COOKIE_MAX_AGE,
      },
    });
  }
}
