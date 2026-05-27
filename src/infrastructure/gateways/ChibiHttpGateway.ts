import type { ChibiImageGateway, ImageFetchResult } from "@/application/ports/ChibiImageGateway";

export class ChibiHttpGateway implements ChibiImageGateway {
  async fetchImage(src: string): Promise<ImageFetchResult> {
    const response = await fetch(src, {
      headers: {
        Accept: "image/avif,image/webp,image/png,image/*,*/*",
        "User-Agent": "BanPick-GI/1.0 (chibi-proxy)",
      },
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.startsWith("image/")) {
      return { ok: false };
    }

    return {
      ok: true,
      contentType,
      body: await response.arrayBuffer(),
    };
  }
}
