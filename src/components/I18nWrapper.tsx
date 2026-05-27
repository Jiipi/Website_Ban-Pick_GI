"use client";

import { I18nProvider } from "@/i18n/I18nProvider";
import type { Locale } from "@/i18n";

export function I18nWrapper({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <I18nProvider initialLocale={locale}>{children}</I18nProvider>;
}
