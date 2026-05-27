"use client";

import { createContext, useContext, useCallback, useState, useMemo, type ReactNode } from "react";
import { t as translate, DEFAULT_LOCALE, type Locale, ALL_LOCALES } from "@/i18n";

type I18nContextValue = {
  locale: Locale;
  t: (key: string) => string;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  t: (key) => key,
  setLocale: () => {},
});

export function I18nProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: {
  initialLocale?: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    if (!ALL_LOCALES.includes(newLocale)) return;
    setLocaleState(newLocale);
    // Persist to cookie
    document.cookie = `locale=${newLocale};path=/;max-age=${365 * 24 * 60 * 60}`;
  }, []);

  const t = useCallback(
    (key: string) => translate(key, locale),
    [locale],
  );

  const value = useMemo(() => ({ locale, t, setLocale }), [locale, t, setLocale]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
