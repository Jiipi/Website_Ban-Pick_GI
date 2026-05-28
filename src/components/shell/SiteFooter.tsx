import Link from "next/link";
import { APP_VERSION, BRAND, FOOTER_GROUPS } from "@/components/nav/navConfig";

export function SiteFooter() {
  const Icon = BRAND.Icon;
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand-col">
          <Link href="/" className="site-header__brand" aria-label={BRAND.name}>
            <span className="site-header__brand-mark">
              <Icon size={18} />
            </span>
            <span className="site-header__brand-text">
              <span className="site-header__brand-name">{BRAND.name}</span>
              <span className="site-header__brand-meta">{BRAND.tagline}</span>
            </span>
          </Link>
          <p className="site-footer__brand-desc">
            Công cụ Ban/Pick realtime cho La Hoàn Cảnh Giới. Tự động tính cost, quản lý giải đấu BO1/BO3/BO5.
          </p>
        </div>
        {FOOTER_GROUPS.map((group) => (
          <div key={group.title} className="site-footer__group">
            <h4>{group.title}</h4>
            <ul>
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="site-footer__link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="site-footer__bottom">
        <span>
          {APP_VERSION} · {BRAND.name} · La Hoàn Cảnh Giới
        </span>
        <div className="site-footer__bottom-links">
          <Link href="/privacy">Chính sách bảo mật</Link>
          <Link href="/terms">Điều khoản</Link>
          <Link href="/feedback">Liên hệ</Link>
        </div>
      </div>
    </footer>
  );
}
