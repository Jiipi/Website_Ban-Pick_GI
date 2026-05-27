import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return jsonResult(await services.characterCatalog.listCharacters({
    refresh: searchParams.get("refresh") === "true",
  }));
}
