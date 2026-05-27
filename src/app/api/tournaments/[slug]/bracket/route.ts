import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const userResult = await services.auth.requireUser();
  if (!userResult.ok) return jsonResult(userResult);

  const detail = await services.tournament.getTournament(slug);
  if (!detail.ok) return jsonResult(detail);

  return jsonResult(await services.tournament.generateBracket(detail.data.tournament.id));
}
