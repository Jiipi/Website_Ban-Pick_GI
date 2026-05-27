import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "Genshin Ban/Pick — Kết Quả";

type Props = {
  params: Promise<{ code: string }>;
};

export default async function OGImage({ params }: Props) {
  const { code } = await params;

  const room = await prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      logs: { orderBy: [{ turnNumber: "asc" }] },
      builds: true,
    },
  });

  if (!room) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#020617",
            color: "#e2e8f0",
            fontSize: 40,
            fontWeight: 900,
          }}
        >
          Room Not Found
        </div>
      ),
      { ...size },
    );
  }

  const blueTeam = room.blueTeamName ?? room.bluePlayerName ?? "BLUE";
  const redTeam = room.redTeamName ?? room.redPlayerName ?? "RED";
  const blueColor = room.blueTeamColor ?? "#3B82F6";
  const redColor = room.redTeamColor ?? "#EF4444";

  const bluePicks = room.logs
    .filter((l) => l.action === "PICK" && l.player === "BLUE")
    .map((l) => l.characterId);
  const redPicks = room.logs
    .filter((l) => l.action === "PICK" && l.player === "RED")
    .map((l) => l.characterId);

  const blueBuildCost = room.builds
    .filter((b) => b.player === "BLUE")
    .reduce((s, b) => s + b.totalCost, 0);
  const redBuildCost = room.builds
    .filter((b) => b.player === "RED")
    .reduce((s, b) => s + b.totalCost, 0);

  const diff = Math.abs(blueBuildCost - redBuildCost);
  const penalized = blueBuildCost > redBuildCost ? "BLUE" : blueBuildCost < redBuildCost ? "RED" : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(160deg, #020617 0%, #0f172a 50%, #020617 100%)",
          color: "#e2e8f0",
          fontFamily: "Inter, sans-serif",
          padding: "40px 50px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 30,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: "#a855f7" }}>⚔️</span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 900,
                letterSpacing: "0.2em",
                textTransform: "uppercase" as const,
                color: "#94a3b8",
              }}
            >
              GENSHIN BAN/PICK
            </span>
          </div>
          <span
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "#475569",
              fontFamily: "monospace",
            }}
          >
            Room {room.code}
          </span>
        </div>

        {/* VS Section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 40,
            marginBottom: 30,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 32, fontWeight: 900, color: blueColor }}>
              {blueTeam}
            </span>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#64748b" }}>
              {bluePicks.length} picks
            </span>
          </div>

          <span style={{ fontSize: 40, fontWeight: 900, color: "#334155" }}>VS</span>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 32, fontWeight: 900, color: redColor }}>
              {redTeam}
            </span>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#64748b" }}>
              {redPicks.length} picks
            </span>
          </div>
        </div>

        {/* Pick Names */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 40,
            flex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              flex: 1,
            }}
          >
            {bluePicks.slice(0, 8).map((id, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px",
                  background: "rgba(59, 130, 246, 0.08)",
                  borderRadius: 6,
                  borderLeft: `3px solid ${blueColor}`,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 800, color: "#cbd5e1" }}>
                  {formatName(id)}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              flex: 1,
            }}
          >
            {redPicks.slice(0, 8).map((id, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 8,
                  padding: "6px 12px",
                  background: "rgba(239, 68, 68, 0.08)",
                  borderRadius: 6,
                  borderRight: `3px solid ${redColor}`,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 800, color: "#cbd5e1" }}>
                  {formatName(id)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer — Cost comparison */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 30,
            marginTop: 20,
            padding: "12px 20px",
            background: "rgba(15, 23, 42, 0.6)",
            borderRadius: 10,
            border: "1px solid rgba(148, 163, 184, 0.08)",
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 900, color: blueColor }}>
            Cost: {blueBuildCost.toFixed(1)}
          </span>
          {penalized && (
            <span style={{ fontSize: 14, fontWeight: 800, color: "#fbbf24" }}>
              Handicap: {diff.toFixed(1)} → {penalized}
            </span>
          )}
          <span style={{ fontSize: 16, fontWeight: 900, color: redColor }}>
            Cost: {redBuildCost.toFixed(1)}
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}

function formatName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
