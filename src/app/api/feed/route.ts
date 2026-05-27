import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";
import { resolveCurrentUid } from "@/presentation/http/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "global";
  const limit = Number(searchParams.get("limit") ?? 30);

  if (scope === "friends") {
    const me = await resolveCurrentUid(request);
    if (me) return jsonResult(await services.activityFeed.getFriendsFeed(me.uid, limit));
  }

  return jsonResult(await services.activityFeed.getGlobalFeed(limit));
}
