import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";
import { failure } from "@/application/shared/ServiceResult";
import { readBearerToken } from "@/presentation/http/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const userResult = await services.auth.requireTournamentManager(readBearerToken(request));
  if (!userResult.ok) return jsonResult(userResult);

  const detail = await services.tournament.getTournament(slug);
  if (!detail.ok) return jsonResult(detail);
  if (userResult.data.role !== "ADMIN" && userResult.data.role !== "REFEREE" && detail.data.tournament.organizerId !== userResult.data.id) {
    return jsonResult(failure(403, "Chi admin, trong tai hoac organizer co quyen tao bracket"));
  }

  return jsonResult(await services.tournament.generateBracket(detail.data.tournament.id));
}
