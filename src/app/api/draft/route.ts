import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return jsonResult(await services.draft.submitAction(body));
}
