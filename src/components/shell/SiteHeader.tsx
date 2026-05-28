"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, Search, X } from "lucide-react";
import {
  ACCOUNT_GROUP,
  BRAND,
  HEADER_GROUPS,
  PRIMARY_NAV,
  type NavGroup,
  type NavLink,
} from "@/components/nav/navConfig";
import { NotificationBell } from "@/components/NotificationBell";

type Props = {
  authenticated?: boolean;
  showNotifications?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function triggerSearch() {
  if (typeof window === "undefined") return;
  const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true });
  window.dispatchEvent(event);
}

function HeaderMenu({ group, pathname }: { group: NavGroup; pathname: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const hasActive = group.links.some((l) => isActive(pathname, l.href));

  return (
    <div className="site-header__menu" ref={containerRef}>
      <button
        type="button"
        className={`site-header__menu-trigger ${open || hasActive ? "is-open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {group.title}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="site-header__menu-panel" role="menu">
          <ul>
            {group.links.map((link) => {
              const Icon = link.Icon;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    role="menuitem"
                    className="site-header__menu-link"
                    onClick={() => setOpen(false)}
                  >
                    {Icon && (
                      <span className="site-header__menu-link-icon">
                        <Icon size={14} />
                      </span>
                    )}
                    <span className="site-header__menu-link-text">
                      <span className="site-header__menu-link-label">{link.label}</span>
                      {link.description && (
                        <span className="site-header__menu-link-desc">{link.description}</span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function MobileSheet({
  open,
  onClose,
  pathname,
  ctaLabel,
  ctaHref,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const groups: NavGroup[] = [
    { title: "Khám phá", links: PRIMARY_NAV },
    ...HEADER_GROUPS,
    ACCOUNT_GROUP,
  ];

  return (
    <div className="site-mobile-sheet" role="dialog" aria-modal="true" onClick={onClose}>
      <aside
        className="site-mobile-sheet__panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="site-mobile-sheet__head">
          <Link href="/" className="site-header__brand" aria-label={BRAND.name} onClick={onClose}>
            <span className="site-header__brand-mark">
              <BRAND.Icon size={18} />
            </span>
            <span className="site-header__brand-text">
              <span className="site-header__brand-name">{BRAND.name}</span>
              <span className="site-header__brand-meta">{BRAND.tagline}</span>
            </span>
          </Link>
          <button
            type="button"
            className="site-header__icon-btn"
            aria-label="Đóng menu"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {groups.map((group) => (
          <div key={group.title} className="site-mobile-sheet__group">
            <h4>{group.title}</h4>
            <ul>
              {group.links.map((link: NavLink) => {
                const Icon = link.Icon;
                const active = isActive(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`site-mobile-sheet__link ${active ? "is-active" : ""}`}
                      onClick={onClose}
                    >
                      {Icon && <Icon size={16} />}
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="site-mobile-sheet__cta">
          <Link href={ctaHref} className="btn-gold" onClick={onClose}>
            {ctaLabel}
          </Link>
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              onClose();
              triggerSearch();
            }}
          >
            <Search size={14} />
            Tìm kiếm (Ctrl+K)
          </button>
        </div>
      </aside>
    </div>
  );
}

export function SiteHeader({
  authenticated = false,
  showNotifications = true,
  ctaLabel = "Vào sảnh chờ",
  ctaHref = "/lobby",
}: Props) {
  const pathname = usePathname() ?? "/";
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__brand" aria-label={BRAND.name}>
          <span className="site-header__brand-mark">
            <BRAND.Icon size={18} />
          </span>
          <span className="site-header__brand-text">
            <span className="site-header__brand-name">{BRAND.name}</span>
            <span className="site-header__brand-meta">{BRAND.tagline}</span>
          </span>
        </Link>

        <nav className="site-header__nav" aria-label="Điều hướng chính">
          {PRIMARY_NAV.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`site-header__link ${active ? "is-active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
          {HEADER_GROUPS.map((group) => (
            <HeaderMenu key={group.title} group={group} pathname={pathname} />
          ))}
        </nav>

        <div className="site-header__actions">
          <button
            type="button"
            className="site-header__search"
            onClick={triggerSearch}
            aria-label="Mở tìm kiếm"
            title="Tìm kiếm (Ctrl+K)"
          >
            <Search size={14} />
            <span>Tìm kiếm</span>
            <kbd>Ctrl K</kbd>
          </button>

          {showNotifications && authenticated && <NotificationBell />}

          <Link href={ctaHref} className="site-header__cta">
            {ctaLabel}
          </Link>

          <button
            type="button"
            className="site-header__icon-btn site-header__menu-toggle"
            aria-label="Mở menu"
            aria-expanded={sheetOpen}
            onClick={() => setSheetOpen(true)}
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      <MobileSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        pathname={pathname}
        ctaLabel={ctaLabel}
        ctaHref={ctaHref}
      />
    </header>
  );
}
