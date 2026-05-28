import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

type Props = {
  children: ReactNode;
  authenticated?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
  showNotifications?: boolean;
  hideFooter?: boolean;
  contentMaxWidth?: string;
};

export function PublicShell({
  children,
  authenticated = false,
  ctaLabel,
  ctaHref,
  showNotifications = true,
  hideFooter = false,
  contentMaxWidth = "1280px",
}: Props) {
  return (
    <div className="site-shell">
      <SiteHeader
        authenticated={authenticated}
        showNotifications={showNotifications}
        ctaLabel={ctaLabel}
        ctaHref={ctaHref}
      />
      <main
        id="main"
        className="site-shell__main"
        style={{ width: "100%" }}
      >
        <div
          className="mx-auto w-full"
          style={{ maxWidth: contentMaxWidth }}
        >
          {children}
        </div>
      </main>
      {!hideFooter && <SiteFooter />}
    </div>
  );
}
