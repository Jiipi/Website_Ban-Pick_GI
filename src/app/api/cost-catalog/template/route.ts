import { NextResponse } from "next/server";
import { services } from "@/composition/services";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const result = await services.costCatalog.getTemplate();
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }

  return new NextResponse(`${JSON.stringify(result.data.catalog, null, 2)}\n`, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"genshin-cost-catalog.json\"",
    },
  });
}
