import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";
import { failure } from "@/application/shared/ServiceResult";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const detail = await services.tournament.getTournament(slug);
  if (!detail.ok) return jsonResult(detail);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return jsonResult(failure(400, "Body không hợp lệ"));
  }

  const { playerUid, playerNickname, playerAvatarUrl } = body as Record<string, unknown>;

  if (typeof playerUid !== "string" || !playerUid.trim()) {
    return jsonResult(failure(400, "Thiếu UID người chơi"));
  }
  if (typeof playerNickname !== "string" || !playerNickname.trim()) {
    return jsonResult(failure(400, "Thiếu nickname"));
  }

  return jsonResult(
    await services.tournament.addParticipant(
      detail.data.tournament.id,
      playerUid.trim(),
      playerNickname.trim(),
      typeof playerAvatarUrl === "string" ? playerAvatarUrl.trim() || null : null,
    ),
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const playerUid = searchParams.get("playerUid");
  if (!playerUid) return jsonResult(failure(400, "Thiếu playerUid"));

  const detail = await services.tournament.getTournament(slug);
  if (!detail.ok) return jsonResult(detail);

  return jsonResult(await services.tournament.removeParticipant(detail.data.tournament.id, playerUid));
}
