import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  const { uid } = await params;
  return jsonResult(await services.leaderboard.getPlayerProfile(uid));
}
