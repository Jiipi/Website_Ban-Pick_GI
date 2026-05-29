import { failure } from "@/application/shared/ServiceResult";
import type { UpdateTournamentInput } from "@/application/ports/TournamentRepository";
import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";
import { readBearerToken } from "@/presentation/http/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  return jsonResult(await services.tournament.getTournament(slug));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const userResult = await services.auth.requireTournamentManager(readBearerToken(request));
  if (!userResult.ok) return jsonResult(userResult);

  const { slug } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return jsonResult(failure(400, "Body khong hop le"));

  const input = normalizeTournamentUpdate(body as Record<string, unknown>);
  if (input.slug && !/^[a-z0-9-]+$/.test(input.slug)) {
    return jsonResult(failure(400, "Slug chi chua chu thuong, so va dau gach ngang"));
  }

  return jsonResult(await services.tournament.updateTournament(slug, input));
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const userResult = await services.auth.requireTournamentManager(readBearerToken(request));
  if (!userResult.ok) return jsonResult(userResult);

  const { slug } = await params;
  return jsonResult(await services.tournament.deleteTournament(slug));
}

function normalizeTournamentUpdate(body: Record<string, unknown>): Omit<UpdateTournamentInput, "id"> {
  return {
    slug: stringValue(body.slug),
    name: stringValue(body.name),
    description: nullableString(body.description),
    format: formatValue(body.format),
    status: statusValue(body.status),
    maxTeams: numberValue(body.maxTeams),
    startDate: dateValue(body.startDate),
    endDate: dateValue(body.endDate),
    costCap: numberValue(body.costCap),
    bankTime: numberValue(body.bankTime),
    fearlessDraft: typeof body.fearlessDraft === "boolean" ? body.fearlessDraft : undefined,
    patch: nullableString(body.patch),
    region: nullableString(body.region),
    rulesText: nullableString(body.rulesText),
    bannerUrl: nullableString(body.bannerUrl),
    prizeInfo: nullableString(body.prizeInfo),
  };
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function nullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  return value.trim() || null;
}

function numberValue(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
}

function dateValue(value: unknown): Date | null | undefined {
  if (value === null || value === "") return null;
  if (!value) return undefined;
  return new Date(String(value));
}

function formatValue(value: unknown): UpdateTournamentInput["format"] | undefined {
  return value === "SINGLE_ELIM" || value === "DOUBLE_ELIM" || value === "ROUND_ROBIN" ? value : undefined;
}

function statusValue(value: unknown): string | undefined {
  return value === "UPCOMING" || value === "ONGOING" || value === "FINISHED" || value === "CANCELLED" ? value : undefined;
}
