import { failure } from "@/application/shared/ServiceResult";
import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_FORMATS = ["SINGLE_ELIM", "DOUBLE_ELIM", "ROUND_ROBIN"] as const;
type TournamentFormat = (typeof VALID_FORMATS)[number];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const format = searchParams.get("format") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? 50);

  return jsonResult(await services.tournament.listTournaments({ status, format, limit }));
}

export async function POST(request: Request) {
  const userResult = await services.auth.requireAdmin();
  if (!userResult.ok) return jsonResult(userResult);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return jsonResult(failure(400, "Body khong hop le"));
  }

  const {
    name,
    slug,
    description,
    format,
    maxTeams,
    startDate,
    endDate,
    costCap,
    bankTime,
    fearlessDraft,
    patch,
    region,
    rulesText,
    bannerUrl,
    prizeInfo,
  } = body as Record<string, unknown>;

  if (typeof name !== "string" || !name.trim()) return jsonResult(failure(400, "Thieu ten giai dau"));
  if (typeof slug !== "string" || !slug.trim()) return jsonResult(failure(400, "Thieu slug"));
  if (!/^[a-z0-9-]+$/.test(slug)) return jsonResult(failure(400, "Slug chi chua chu thuong, so va dau gach ngang"));

  const teamCount = Number(maxTeams);
  if (![4, 8, 16, 32].includes(teamCount)) {
    return jsonResult(failure(400, "So doi phai la 4, 8, 16 hoac 32"));
  }

  const tournamentFormat = String(format || "SINGLE_ELIM");
  if (!VALID_FORMATS.includes(tournamentFormat as TournamentFormat)) {
    return jsonResult(failure(400, "Format khong hop le"));
  }

  return jsonResult(
    await services.tournament.createTournament({
      slug: slug.trim(),
      name: name.trim(),
      description: typeof description === "string" ? description.trim() || null : null,
      format: tournamentFormat as TournamentFormat,
      maxTeams: teamCount,
      startDate: startDate ? new Date(String(startDate)) : null,
      endDate: endDate ? new Date(String(endDate)) : null,
      costCap: clampInt(costCap, 0, 999, 36),
      bankTime: clampInt(bankTime, 30, 600, 120),
      fearlessDraft: fearlessDraft === true,
      patch: typeof patch === "string" ? patch.trim() || null : null,
      region: typeof region === "string" ? region.trim() || null : null,
      rulesText: typeof rulesText === "string" ? rulesText.trim() || null : null,
      organizerId: userResult.data.id,
      organizerName: userResult.data.name ?? userResult.data.email,
      bannerUrl: typeof bannerUrl === "string" ? bannerUrl.trim() || null : null,
      prizeInfo: typeof prizeInfo === "string" ? prizeInfo.trim() || null : null,
    }),
  );
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}
