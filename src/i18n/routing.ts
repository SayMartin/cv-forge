// Turning app paths into locale-prefixed URLs, and back.
//
// Pure string functions with no React and no "use client", so the same three
// helpers serve Server Components, Client Components and `proxy.ts`. Every
// internal link in the app goes through one of them — see `LocaleLink`.

import { isLocale, type Locale } from "./config";

/**
 * `/cvs` → `/sv/cvs`. The one function that builds an internal href.
 *
 * Idempotent on an already-prefixed path, so a caller that cannot easily tell
 * whether it holds a raw or a built path is safe either way. That matters
 * because `callbackUrl` values round-trip through the query string and arrive
 * back already carrying a prefix.
 */
export function localeHref(locale: Locale, path: string): string {
  if (!path.startsWith("/")) return path; // mailto:, https:, #anchor — leave alone
  const stripped = stripLocale(path);
  return stripped === "/" ? `/${locale}` : `/${locale}${stripped}`;
}

/**
 * `/sv/cvs` → `/cvs`, and `/sv` → `/`.
 *
 * Used to compare a live `usePathname()` against the un-prefixed hrefs the app
 * is written in — most importantly for NavBar's active-section marker, which
 * silently stops matching the moment a prefix appears.
 */
export function stripLocale(pathname: string): string {
  const [, first, ...rest] = pathname.split("/");
  if (!isLocale(first)) return pathname;
  return rest.length ? `/${rest.join("/")}` : "/";
}

/**
 * Replace the locale segment, keeping everything after it. This is the language
 * toggle's entire job.
 *
 * Only the first segment is touched, which is safe for every route in the app
 * because no path segment is ever a translated word: CV ids are opaque cuids and
 * every other segment is a fixed English slug. If a localised slug is ever
 * introduced, this function is where that breaks.
 */
export function swapLocale(pathname: string, to: Locale): string {
  return localeHref(to, stripLocale(pathname));
}
