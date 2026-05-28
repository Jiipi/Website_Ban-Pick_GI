import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export type PageHeaderAccent = "cyan" | "amber" | "rose" | "violet";

type Props = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  Icon?: LucideIcon;
  accent?: PageHeaderAccent;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  children?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  Icon,
  accent = "cyan",
  actions,
  backHref,
  backLabel = "Quay lại",
  children,
}: Props) {
  return (
    <section className="page-header">
      <div className="page-header__row">
        <div className="page-header__lead">
          {Icon && (
            <span className="page-header__icon" data-accent={accent}>
              <Icon size={22} />
            </span>
          )}
          <div>
            {eyebrow && <p className="page-header__eyebrow">{eyebrow}</p>}
            <h1 className="page-header__title">{title}</h1>
          </div>
        </div>
        <div className="page-header__actions">
          {backHref && (
            <Link href={backHref} className="page-header__back">
              <ArrowLeft size={14} />
              {backLabel}
            </Link>
          )}
          {actions}
        </div>
      </div>
      {description && <p className="page-header__description">{description}</p>}
      {children}
    </section>
  );
}
