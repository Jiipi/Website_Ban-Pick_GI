import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  generateEtags: false,
  poweredByHeader: false,
  images: {
    minimumCacheTTL: 0,
    remotePatterns: [
      { protocol: "https", hostname: "enka.network" },
      { protocol: "https", hostname: "genshin.jmp.blue" },
      { protocol: "https", hostname: "genshin-impact.fandom.com" },
      { protocol: "https", hostname: "static.wikia.nocookie.net" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
          { key: "Surrogate-Control", value: "no-store" },
          { key: "CDN-Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/favicon.ico",
        destination: "/favicon.svg",
      },
    ];
  },
};

export default nextConfig;
