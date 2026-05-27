import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";
import { failure } from "@/application/shared/ServiceResult";
import { resolveCurrentUid } from "@/presentation/http/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uidParam = searchParams.get("uid");

  if (uidParam) {
    return jsonResult(await services.achievement.getForUser(uidParam));
  }

  const me = await resolveCurrentUid(request);
  if (!me) return jsonResult(failure(401, "Chưa đăng ký UID"));

  return jsonResult(await services.achievement.getForUser(me.uid));
}
