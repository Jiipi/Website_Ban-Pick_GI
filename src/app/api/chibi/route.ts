import { NextResponse } from "next/server";
import { services } from "@/composition/services";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const image = await services.chibiImage.getImage({
    src: searchParams.get("src"),
    name: searchParams.get("name") ?? "Chibi",
  });

  return new NextResponse(image.body, { headers: image.headers });
}
