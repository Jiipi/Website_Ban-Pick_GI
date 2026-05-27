import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";
import { failure } from "@/application/shared/ServiceResult";
import { resolveCurrentUid } from "@/presentation/http/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const me = await resolveCurrentUid(request);
  if (!me) return jsonResult(failure(401, "Chưa đăng ký UID"));

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 30);
  return jsonResult(await services.notification.list(me.uid, limit));
}

export async function PATCH(request: Request) {
  const me = await resolveCurrentUid(request);
  if (!me) return jsonResult(failure(401, "Chưa đăng ký UID"));

  const body = await request.json().catch(() => ({}));
  const { id, all } = body as Record<string, unknown>;

  if (all === true) {
    return jsonResult(await services.notification.markAllRead(me.uid));
  }
  if (typeof id !== "string" || !id) return jsonResult(failure(400, "Thiếu id"));
  return jsonResult(await services.notification.markRead(me.uid, id));
}

export async function DELETE(request: Request) {
  const me = await resolveCurrentUid(request);
  if (!me) return jsonResult(failure(401, "Chưa đăng ký UID"));

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonResult(failure(400, "Thiếu id"));

  return jsonResult(await services.notification.remove(me.uid, id));
}
