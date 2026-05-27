import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OverlayBoard } from "@/components/overlay/OverlayBoard";
import { getCharacters } from "@/lib/genshin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type OverlayPageProps = {
  params: Promise<{ code: string }>;
};

export default async function OverlayPage({ params }: OverlayPageProps) {
  const { code } = await params;
  const roomCode = code.toUpperCase();

  const room = await prisma.room.findUnique({
    where: { code: roomCode },
    include: {
      logs: { orderBy: [{ turnNumber: "asc" }, { id: "asc" }] },
    },
  });

  if (!room) notFound();

  const characters = await getCharacters();

  return (
    <main className="overlay-root">
      <OverlayBoard
        roomCode={room.code}
        roomId={room.id}
        status={room.status}
        logs={room.logs.map((l) => ({
          player: l.player,
          action: l.action,
          characterId: l.characterId,
          turnNumber: l.turnNumber,
        }))}
        characters={characters}
        blueTeamName={room.blueTeamName ?? "BLUE"}
        redTeamName={room.redTeamName ?? "RED"}
        blueTeamLogo={room.blueTeamLogo}
        redTeamLogo={room.redTeamLogo}
        blueTeamColor={room.blueTeamColor ?? "#3B82F6"}
        redTeamColor={room.redTeamColor ?? "#EF4444"}
        bluePlayerName={room.bluePlayerName}
        redPlayerName={room.redPlayerName}
        blueBankTime={room.blueBankTime}
        redBankTime={room.redBankTime}
        lastTurnStartedAt={room.lastTurnStartedAt?.toISOString() ?? null}
        seriesFormat={room.seriesFormat}
        gameNumber={room.gameNumber}
        spectatorDelay={room.spectatorDelay}
      />
    </main>
  );
}
