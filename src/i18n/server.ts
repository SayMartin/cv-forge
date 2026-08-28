import { lang } from "next/root-params";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";
import { dictionaryFor, type Dictionary } from "./dictionaries";
import { localeHref } from "./routing";

/**
 * The active locale, for Server Components.
 *
 * `next/root-params` exposes a getter for each dynamic segment above the root
 * layout. Because every route lives under `app/[lang]`, any Server Component or
 * server-side utility can read it without threading `params` down through props.
 *
 * Not usable in Client Components (see `useLocale`), Server Actions, or Route
 * Handlers — the module throws at build time if imported into one.
 *
 * The DEFAULT_LOCALE fallback should be unreachable: `proxy.ts` redirects any
 * path whose first segment is not a known locale, so a rendered page always has
 * a valid one. A `notFound()` here would be the stricter choice, but it trades a
 * working page for a 404 in a case that cannot occur.
 */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** `localeHref` for Server Components — mainly for `redirect()` targets. */
export async function localePath(path: string): Promise<string> {
  return localeHref(await getLocale(), path);
}

/**
 * The active dictionary, for Server Components.
 *
 * Client Components use `useDictionary()` instead; they are fed by
 * `DictionaryProvider`, which this function supplies from the root layout.
 *
 * Lives here rather than beside the dictionaries because it reads
 * `next/root-params` — importing it makes a module server-only, and
 * `src/i18n/dictionaries/` has to stay importable for its types from anywhere.
 */
export async function getDictionary(): Promise<Dictionary> {
  return dictionaryFor(await getLocale());
}
