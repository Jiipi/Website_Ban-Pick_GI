import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";
import { failure } from "@/application/shared/ServiceResult";
import { resolveCurrentUid } from "@/presentation/http/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const me = await resolveCurrentUid(request);
  if (!me) return jsonResult(failure(401, "Chưa đăng ký UID"));
  return jsonResult(await services.userSettings.get(me.uid));
}

export async function PATCH(request: Request) {
  const me = await resolveCurrentUid(request);
  if (!me) return jsonResult(failure(401, "Chưa đăng ký UID"));

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return jsonResult(failure(400, "Body không hợp lệ"));

  return jsonResult(await services.userSettings.update(me.uid, body as Record<string, unknown>));
}
