import { NextResponse } from "next/server";
import { services } from "@/composition/services";
import type { ArchiveFilters } from "@/application/services/ArchiveService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const filters: ArchiveFilters = {
    query: searchParams.get("query") ?? undefined,
    character: searchParams.get("character") ?? undefined,
    format: searchParams.get("format") ?? undefined,
    sort: (searchParams.get("sort") as ArchiveFilters["sort"]) ?? "recent",
    limit: Number(searchParams.get("limit")) || 50,
  };

  const result = await services.archive.listPublicMatches(filters);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }

  return NextResponse.json(result.data, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}
