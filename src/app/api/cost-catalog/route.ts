import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return jsonResult(await services.costCatalog.getCatalog());
}

export async function POST(request: Request) {
  const auth = await services.auth.requireUser();
  if (!auth.ok) return jsonResult(auth);

  const body = await request.json().catch(() => ({}));
  return jsonResult(await services.costCatalog.importCatalog(body, auth.data));
}
