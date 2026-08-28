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

/**
 * The BCP 47 tag each locale hands to `Intl` — a different thing from `Locale`,
 * which is a URL segment and a dictionary key.
 *
 * The region matters and the bare language subtag will not do. `Intl` resolves
 * `"en"` to the American defaults, so `toLocaleDateString("en")` renders
 * `8/28/2026`; this app has always shown `28 Aug 2026`, and every existing CV
 * was authored against that. `"en-GB"` is therefore the tag, not a nicety.
 *
 * Only for formatters. The CV's *own* language is separate data with its own
 * table — see `Cv.language`.
 */
export const INTL_LOCALES: Record<Locale, string> = {
  sv: "sv-SE",
  en: "en-GB",
};

/** The cookie that carries the locale past `proxy.ts`, which cannot reach Postgres. */
export const LOCALE_COOKIE = "cvforge_locale";

/**
 * Written from three places — `proxy.ts`, `POST /api/locale`, and
 * `GET /api/locale/resume` — so the attributes live here rather than being
 * retyped in each. A cookie written with a different `path` or `sameSite` from
 * one of the three is a second cookie as far as the browser is concerned, and
 * the resulting "my language keeps reverting" is miserable to track down.
 *
 * `secure` is the caller's to supply, because only the caller knows whether the
 * request arrived over https — it is http in development and https behind
 * Cloudflare in production.
 */
export function localeCookieOptions(secure: boolean) {
  return {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax" as const,
    // Not httpOnly: a display preference, not a credential. Keeping it readable
    // is what lets the client correct it without a round trip.
    httpOnly: false,
    secure,
  };
}
