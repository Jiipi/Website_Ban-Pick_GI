import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSeriesState } from "@/domain/series/SeriesPolicy";
import type { RoomRecord } from "@/application/ports/BanPickRepository";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ code: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  const { code } = await ctx.params;
  const roomCode = code.toUpperCase();

  try {
    const roomRecord = await prisma.room.findUnique({ where: { code: roomCode } });
    if (!roomRecord || !roomRecord.seriesId) {
      return NextResponse.json({ series: null });
    }
    const seriesRooms = await prisma.room.findMany({
      where: { seriesId: roomRecord.seriesId },
      orderBy: { gameNumber: "asc" },
    });
    const state = getSeriesState(seriesRooms as unknown as RoomRecord[]);
    return NextResponse.json({ series: state });
  } catch {
    return NextResponse.json({ series: null });
  }
}
