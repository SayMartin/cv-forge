// The locale set, and nothing else.
//
// Deliberately dependency-free and free of any Next import: this module is
// pulled in by `proxy.ts` (which runs on every page request and may be deployed
// to a CDN), by Server Components, and by Client Components alike. Anything
// heavier than a string union here would be paid for three times over.

export const LOCALES = ["sv", "en"] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * English, not Swedish, is the fallback.
 *
 * Everything that exists today — every CV, every indexed page, every `en-GB`
 * date — was authored in English. A visitor whose `Accept-Language` we cannot
 * read gets what the app has always served, rather than a language they may not
 * speak. Swedish is reached by preference, not by default.
 */
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** The cookie that carries the locale past `proxy.ts`, which cannot reach Postgres. */
export const LOCALE_COOKIE = "cvforge_locale";
