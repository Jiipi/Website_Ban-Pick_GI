import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";
import { failure } from "@/application/shared/ServiceResult";
import { resolveCurrentUid } from "@/presentation/http/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const me = await resolveCurrentUid(request);
  if (!me) return jsonResult(failure(401, "Chưa đăng ký UID"));

  const [friendsResult, pendingResult] = await Promise.all([
    services.friendship.listFriends(me.uid),
    services.friendship.listPending(me.uid),
  ]);

  if (!friendsResult.ok) return jsonResult(friendsResult);
  if (!pendingResult.ok) return jsonResult(pendingResult);

  return jsonResult({
    ok: true,
    data: {
      me: { uid: me.uid, nickname: me.nickname, avatarUrl: me.avatarUrl },
      friends: friendsResult.data.friends,
      incoming: pendingResult.data.incoming,
      outgoing: pendingResult.data.outgoing,
    },
  });
}

export async function POST(request: Request) {
  const me = await resolveCurrentUid(request);
  if (!me) return jsonResult(failure(401, "Chưa đăng ký UID"));

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return jsonResult(failure(400, "Body không hợp lệ"));

  const { addresseeUid } = body as Record<string, unknown>;
  if (typeof addresseeUid !== "string" || !addresseeUid.trim()) {
    return jsonResult(failure(400, "Thiếu UID người nhận"));
  }

  return jsonResult(
    await services.friendship.sendRequest(me.uid, addresseeUid.trim(), me.nickname),
  );
}

export async function DELETE(request: Request) {
  const me = await resolveCurrentUid(request);
  if (!me) return jsonResult(failure(401, "Chưa đăng ký UID"));

  const { searchParams } = new URL(request.url);
  const otherUid = searchParams.get("uid");
  if (!otherUid) return jsonResult(failure(400, "Thiếu uid"));

  return jsonResult(await services.friendship.removeFriend(me.uid, otherUid));
}
