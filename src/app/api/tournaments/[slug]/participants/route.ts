import { failure } from "@/application/shared/ServiceResult";
import { services } from "@/composition/services";
import { jsonResult } from "@/presentation/http/respond";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type MemberPayload = {
  uid?: unknown;
  nickname?: unknown;
  avatarUrl?: unknown;
  arLevel?: unknown;
  role?: unknown;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const detail = await services.tournament.getTournament(slug);
  if (!detail.ok) return jsonResult(detail);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return jsonResult(failure(400, "Body khong hop le"));
  }

  const {
    playerUid,
    playerNickname,
    playerAvatarUrl,
    teamName,
    logoUrl,
    captainUid,
    members,
  } = body as Record<string, unknown>;

  if (typeof playerUid !== "string" || !playerUid.trim()) {
    return jsonResult(failure(400, "Thieu UID nguoi choi"));
  }
  if (typeof playerNickname !== "string" || !playerNickname.trim()) {
    return jsonResult(failure(400, "Thieu nickname"));
  }

  const normalizedMembers = Array.isArray(members)
    ? members
        .map((raw) => normalizeMember(raw as MemberPayload))
        .filter((member): member is NonNullable<ReturnType<typeof normalizeMember>> => Boolean(member))
    : undefined;

  return jsonResult(
    await services.tournament.addParticipant(
      detail.data.tournament.id,
      playerUid.trim(),
      playerNickname.trim(),
      typeof playerAvatarUrl === "string" ? playerAvatarUrl.trim() || null : null,
      {
        teamName: typeof teamName === "string" ? teamName.trim() || null : null,
        logoUrl: typeof logoUrl === "string" ? logoUrl.trim() || null : null,
        captainUid: typeof captainUid === "string" ? captainUid.trim() || playerUid.trim() : playerUid.trim(),
        members: normalizedMembers,
      },
    ),
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const playerUid = searchParams.get("playerUid");
  if (!playerUid) return jsonResult(failure(400, "Thieu playerUid"));

  const detail = await services.tournament.getTournament(slug);
  if (!detail.ok) return jsonResult(detail);

  return jsonResult(await services.tournament.removeParticipant(detail.data.tournament.id, playerUid));
}

function normalizeMember(raw: MemberPayload) {
  if (!raw || typeof raw.uid !== "string" || typeof raw.nickname !== "string") return null;
  const uid = raw.uid.trim();
  const nickname = raw.nickname.trim();
  if (!uid || !nickname) return null;
  return {
    uid,
    nickname,
    avatarUrl: typeof raw.avatarUrl === "string" ? raw.avatarUrl.trim() || null : null,
    arLevel: typeof raw.arLevel === "number" && Number.isFinite(raw.arLevel) ? raw.arLevel : null,
    role: raw.role === "CAPTAIN" ? "CAPTAIN" as const : "PLAYER" as const,
  };
}
