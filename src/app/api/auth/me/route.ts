import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";
import { readBearerToken } from "@/presentation/http/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  return jsonResult(await services.auth.requireUser(readBearerToken(request)));
}
