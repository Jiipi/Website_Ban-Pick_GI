import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";
import { failure } from "@/application/shared/ServiceResult";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminCheck = await services.auth.requireAdmin();
  if (!adminCheck.ok) return jsonResult(adminCheck);

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return jsonResult(failure(400, "Body không hợp lệ"));

  const role = String((body as Record<string, unknown>).role ?? "");
  return jsonResult(await services.adminUser.updateUserRole(id, role));
}
