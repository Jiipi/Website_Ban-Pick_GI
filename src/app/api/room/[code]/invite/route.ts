import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = {
  params: Promise<{ code: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const { code } = await params;
  const body = await request.json().catch(() => ({}));
  return jsonResult(await services.invite.invite(code, body));
}

export async function DELETE(request: Request, { params }: Params) {
  const { code } = await params;
  const body = await request.json().catch(() => ({}));
  return jsonResult(await services.invite.cancel(code, body));
}
