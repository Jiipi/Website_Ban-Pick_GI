import vi from "./locales/vi.json";
import en from "./locales/en.json";
import zh from "./locales/zh.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";

export type Locale = "vi" | "en" | "zh" | "ja" | "ko";

export const LOCALE_LABELS: Record<Locale, string> = {
  vi: "Tiếng Việt",
  en: "English",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
};

export const ALL_LOCALES: Locale[] = ["vi", "en", "zh", "ja", "ko"];
export const DEFAULT_LOCALE: Locale = "vi";

const messages: Record<Locale, Record<string, string>> = {
  vi: vi as Record<string, string>,
  en: en as Record<string, string>,
  zh: zh as Record<string, string>,
  ja: ja as Record<string, string>,
  ko: ko as Record<string, string>,
};

/**
 * Translate a key for a given locale.
 * Falls back to Vietnamese, then to the key itself.
 */
export function t(key: string, locale: Locale = DEFAULT_LOCALE): string {
  return messages[locale]?.[key] ?? messages.vi[key] ?? key;
}

/**
 * Get locale from cookie string (server-side).
 */
export function getLocaleFromCookie(cookieStr: string | undefined): Locale {
  if (!cookieStr) return DEFAULT_LOCALE;
  const match = cookieStr.match(/(?:^|;\s*)locale=(\w+)/);
  if (match && ALL_LOCALES.includes(match[1] as Locale)) {
    return match[1] as Locale;
  }
  return DEFAULT_LOCALE;
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && ALL_LOCALES.includes(value as Locale);
}
