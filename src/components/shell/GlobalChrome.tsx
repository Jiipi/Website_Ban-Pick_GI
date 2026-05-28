"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

const HIDE_PREFIXES = ["/room/", "/overlay/"];

export function GlobalChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const hidden = HIDE_PREFIXES.some((p) => pathname.startsWith(p));
  if (hidden) return <>{children}</>;
  return (
    <div className="site-shell">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
