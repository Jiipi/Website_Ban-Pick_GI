import { NextResponse } from "next/server";
import { services } from "@/composition/services";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ code: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  const { code } = await ctx.params;
  const roomCode = code.toUpperCase();

  try {
    const result = await services.room.getSeriesState(roomCode);
    return NextResponse.json(result.ok ? result.data : { series: null });
  } catch {
    return NextResponse.json({ series: null });
  }
}
