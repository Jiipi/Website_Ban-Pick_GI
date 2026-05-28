import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { services } from "@/composition/services";
import { DraftBoard } from "@/components/DraftBoard";
import { InlineBuildBoard } from "@/components/InlineBuildBoard";
import { DraftBoardSkeleton } from "@/components/draft/DraftBoardSkeleton";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { RoomAccessRecovery } from "@/components/RoomAccessRecovery";
import { defaultCostCatalog } from "@/domain/cost/CostCatalog";
import { SESSION_KEYS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RoomPageProps = {
  params: Promise<{ code: string }>;
  searchParams?: Promise<{ cid?: string | string[] }>;
};

export default async function RoomPage({ params, searchParams }: RoomPageProps) {
  const { code } = await params;
  const query = searchParams ? await searchParams : {};
  const queryClientId = typeof query.cid === "string" ? query.cid : "";
  const cookieStore = await cookies();
  const clientId = queryClientId || cookieStore.get(SESSION_KEYS.clientId)?.value || "";
  const pageData = await services.room.getDraftPageData(code, clientId);

  if (!pageData.ok) {
    notFound();
  }

  const { room } = pageData.data;

  if (!pageData.data.authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="glass-strong w-full max-w-md rounded-3xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-3xl">🔒</div>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-rose-300">Phòng riêng tư</p>
          <h1 className="mt-2 text-xl font-black text-slate-100">Không có quyền truy cập</h1>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            Chỉ Trọng tài và 2 Player được mời mới vào được phòng <span className="font-mono text-cyan-300">{room.code}</span>.
            Nếu bạn là Player, hãy đăng ký UID ở sảnh chờ và đợi trọng tài mời.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Link href="/" className="btn-secondary">Về trang chủ</Link>
            <Link href="/lobby" className="btn-primary">Vào sảnh chờ</Link>
          </div>
          <RoomAccessRecovery roomCode={room.code} />
        </div>
      </main>
    );
  }

  const { characters } = pageData.data;

  if (room.status === "FINISHED") {
    redirect(`/room/${room.code}/result`);
  }

  if (room.status === "BUILDING") {
    const buildPageData = await services.room.getBuildPageData(code, clientId);

    if (!buildPageData.ok) {
      notFound();
    }

    if (!buildPageData.data.authorized) {
      return (
        <main className="flex min-h-screen items-center justify-center px-4">
          <div className="glass-strong w-full max-w-md rounded-3xl p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-xs font-black text-rose-200">LOCK</div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-rose-300">Phòng riêng tư</p>
            <h1 className="mt-2 text-xl font-black text-slate-100">Không có quyền truy cập</h1>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              Chỉ trọng tài và 2 player được mời mới vào được phòng <span className="font-mono text-cyan-300">{room.code}</span>.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link href="/" className="btn-secondary">Về trang chủ</Link>
              <Link href="/lobby" className="btn-primary">Vào sảnh chờ</Link>
            </div>
            <RoomAccessRecovery roomCode={room.code} />
          </div>
        </main>
      );
    }

    const { room: buildRoom, bluePicks, redPicks } = buildPageData.data;
    const weaponsData = await services.weaponCatalog.listWeapons();
    const costCatalogData = await services.costCatalog.getCatalog();
    const weapons = weaponsData.ok ? weaponsData.data.weapons : [];
    const costCatalog = costCatalogData.ok ? costCatalogData.data.catalog : defaultCostCatalog;

    return (
      <main className="min-h-screen overflow-hidden px-2 py-2 lg:px-3">
        <RealtimeRefresh roomId={buildRoom.id} roomCode={buildRoom.code} />
        <InlineBuildBoard
          roomCode={buildRoom.code}
          roomId={buildRoom.id}
          viewerClientId={clientId}
          logs={buildRoom.logs}
          characters={characters}
          weapons={weapons}
          costCatalog={costCatalog}
          bluePicks={bluePicks}
          redPicks={redPicks}
          existingBuilds={buildRoom.builds}
          status={buildRoom.status}
          costPerPoint={buildRoom.costPerPoint}
          hostClientId={buildRoom.hostClientId}
          blueClientId={buildRoom.blueClientId}
          redClientId={buildRoom.redClientId}
          bluePlayerName={buildRoom.bluePlayerName}
          redPlayerName={buildRoom.redPlayerName}
          blueUid={buildRoom.blueUid}
          redUid={buildRoom.redUid}
          blueNickname={buildRoom.blueNickname}
          redNickname={buildRoom.redNickname}
          blueAvatarUrl={buildRoom.blueAvatarUrl}
          redAvatarUrl={buildRoom.redAvatarUrl}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden px-2 py-2 lg:px-3">
      <RealtimeRefresh roomId={room.id} roomCode={room.code} />
      <Suspense fallback={<DraftBoardSkeleton />}>
        <DraftBoard
        roomCode={room.code}
        characters={characters}
        logs={room.logs}
        status={room.status}
        hostName={room.hostName}
        hostClientId={room.hostClientId}
        blueClientId={room.blueClientId}
        redClientId={room.redClientId}
        bluePlayerName={room.bluePlayerName}
        redPlayerName={room.redPlayerName}
        blueUid={room.blueUid}
        redUid={room.redUid}
        blueNickname={room.blueNickname}
        redNickname={room.redNickname}
        blueAvatarUrl={room.blueAvatarUrl}
        redAvatarUrl={room.redAvatarUrl}
        buildCount={room._count.builds}
        updatedAt={room.updatedAt.toISOString()}
        lastTurnStartedAt={room.lastTurnStartedAt?.toISOString() ?? null}
        draftTemplate={room.draftTemplate}
        />
      </Suspense>
    </main>
  );
}
