import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";
import { failure } from "@/application/shared/ServiceResult";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; matchId: string }> },
) {
  const { slug, matchId } = await params;
  const userResult = await services.auth.requireUser();
  if (!userResult.ok) return jsonResult(userResult);

  const detail = await services.tournament.getTournament(slug);
  if (!detail.ok) return jsonResult(detail);
  if (userResult.data.role !== "ADMIN" && detail.data.tournament.organizerId !== userResult.data.id) {
    return jsonResult(failure(403, "Chi admin hoac organizer co quyen ghi ket qua"));
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return jsonResult(failure(400, "Body không hợp lệ"));
  }

  const { winnerParticipantId, roomCode } = body as Record<string, unknown>;
  if (typeof winnerParticipantId !== "string" || !winnerParticipantId.trim()) {
    return jsonResult(failure(400, "Thiếu winnerParticipantId"));
  }

  return jsonResult(
    await services.tournament.recordMatchResult(
      matchId,
      winnerParticipantId.trim(),
      typeof roomCode === "string" ? roomCode.trim() || undefined : undefined,
    ),
  );
}
