import type { ChibiImageGateway } from "@/application/ports/ChibiImageGateway";

const NO_CACHE = "no-cache, no-store, must-revalidate";

export type ChibiImageResponse = {
  body: string | ArrayBuffer;
  headers: Record<string, string>;
};

export class ChibiImageService {
  constructor(private readonly imageGateway: ChibiImageGateway) {}

  async getImage(input: { src: string | null; name: string }): Promise<ChibiImageResponse> {
    if (input.src && this.isAllowedStaticUrl(input.src)) {
      const image = await this.imageGateway.fetchImage(input.src);
      if (image.ok) {
        return {
          body: image.body,
          headers: this.noCacheHeaders(image.contentType),
        };
      }
    }

    return {
      body: this.renderPlaceholderSvg(input.name),
      headers: this.noCacheHeaders("image/svg+xml; charset=utf-8"),
    };
  }

  private isAllowedStaticUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        url.hostname === "static.wikia.nocookie.net" &&
        url.pathname.startsWith("/gensin-impact/images/") &&
        url.pathname.includes("Icon_Emoji_Paimon%27s_Paintings_")
      );
    } catch {
      return false;
    }
  }

  private noCacheHeaders(contentType: string): Record<string, string> {
    return {
      "Content-Type": contentType,
      "Cache-Control": NO_CACHE,
      Pragma: "no-cache",
      Expires: "0",
    };
  }

  private renderPlaceholderSvg(name: string): string {
    const safeName = this.escapeXml(name);
    const initials = safeName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?";

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#27365f"/>
      <stop offset="1" stop-color="#151c35"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="10" fill="url(#bg)"/>
  <circle cx="64" cy="50" r="24" fill="#dce7ff" opacity=".85"/>
  <path d="M23 117c4-25 22-39 41-39s37 14 41 39" fill="#dce7ff" opacity=".72"/>
  <text x="64" y="58" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="800" fill="#23304e">${initials}</text>
  <text x="64" y="121" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="700" fill="#f8fbff" opacity=".82">${safeName}</text>
</svg>`;
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}
