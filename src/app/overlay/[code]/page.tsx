import { notFound } from "next/navigation";
import { OverlayBoard } from "@/components/overlay/OverlayBoard";
import { services } from "@/composition/services";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type OverlayPageProps = {
  params: Promise<{ code: string }>;
};

export default async function OverlayPage({ params }: OverlayPageProps) {
  const { code } = await params;
  const result = await services.room.getOverlayPageData(code);
  if (!result.ok) notFound();
  const { room, characters } = result.data;

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
