import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const characterId = searchParams.get("id");

  if (characterId) {
    return jsonResult(await services.characterStats.getCharacterStats(characterId));
  }

  return jsonResult(await services.characterStats.getAllStats());
}
