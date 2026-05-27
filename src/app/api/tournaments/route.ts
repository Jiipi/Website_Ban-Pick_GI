import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";
import { failure } from "@/application/shared/ServiceResult";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? 50);
  return jsonResult(await services.tournament.listTournaments({ status, limit }));
}

export async function POST(request: Request) {
  const userResult = await services.auth.requireUser();
  if (!userResult.ok) return jsonResult(userResult);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return jsonResult(failure(400, "Body không hợp lệ"));
  }

  const { name, slug, description, format, maxTeams, startDate, endDate, bannerUrl, prizeInfo } = body as Record<string, unknown>;

  if (typeof name !== "string" || !name.trim()) return jsonResult(failure(400, "Thiếu tên giải đấu"));
  if (typeof slug !== "string" || !slug.trim()) return jsonResult(failure(400, "Thiếu slug"));
  if (!/^[a-z0-9-]+$/.test(slug)) return jsonResult(failure(400, "Slug chỉ chứa chữ thường, số và dấu gạch ngang"));

  const teamCount = Number(maxTeams);
  if (![4, 8, 16, 32].includes(teamCount)) {
    return jsonResult(failure(400, "Số đội phải là 4, 8, 16 hoặc 32"));
  }

  return jsonResult(
    await services.tournament.createTournament({
      slug: slug.trim(),
      name: name.trim(),
      description: typeof description === "string" ? description.trim() || null : null,
      format: "SINGLE_ELIM",
      maxTeams: teamCount,
      startDate: startDate ? new Date(String(startDate)) : null,
      endDate: endDate ? new Date(String(endDate)) : null,
      organizerId: userResult.data.id,
      organizerName: userResult.data.name ?? userResult.data.email,
      bannerUrl: typeof bannerUrl === "string" ? bannerUrl.trim() || null : null,
      prizeInfo: typeof prizeInfo === "string" ? prizeInfo.trim() || null : null,
    }),
  );
}
