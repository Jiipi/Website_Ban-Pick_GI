import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = {
  params: Promise<{ code: string }>;
};

export async function GET(request: Request, { params }: Params) {
  const { code } = await params;
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId") ?? "";
  return jsonResult(await services.room.getRoomSnapshot(code, clientId));
}
