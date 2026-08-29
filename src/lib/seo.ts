import type { Metadata } from "next";
import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from "@/i18n/config";
import { dictionaryFor, type Dictionary } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";

// The metadata half of internationalisation: what the crawler and the browser
// tab see, as opposed to what the page renders.

/**
 * Open Graph wants an underscored, region-bearing tag — `en_GB`, not `en`.
 *
 * Note this is a *third* spelling of the same idea, alongside `Locale` (a URL
 * segment) and `INTL_LOCALES` (BCP 47 for `Intl`). They are kept apart because
 * they answer to three different specifications, and collapsing them is how a
 * formatter silently starts producing `8/28/2026`.
 */
const OG_LOCALES: Record<Locale, string> = {
  sv: "sv_SE",
  en: "en_GB",
};

/**
 * The locale for a metadata function, from `params` — **not** from
 * `next/root-params`.
 *
 * The docs guarantee root-params in Server Components, and `generateMetadata`
 * is not one. `params` carries `lang` for every route in this app because every
 * route lives under `app/[lang]`, so there is nothing to gain by reaching for
 * the other mechanism and a documented guarantee to lose.
 */
export function metaLocale(lang: string | undefined): Locale {
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
}

/** The dictionary, for a metadata function. Synchronous; server-only. */
export function metaDictionary(lang: string | undefined): Dictionary {
  return dictionaryFor(metaLocale(lang));
}

/**
 * `hreflang` + canonical for a page that genuinely exists in both languages.
 *
 * **Only worth adding where a crawler can actually read it.** `/cvs`,
 * `/content`, `/settings` and `/import` are `Disallow`ed in robots.txt and the
 * auth pages are `noindex`; hreflang on either is inert, and advertising a
 * crawl surface that does not exist is a puzzle for the next reader. That
 * leaves the landing page and the privacy policy — see `canonicalOverride` for
 * the second one, which is not a symmetric pair.
 *
 * `x-default` points at the **un-prefixed** path. That is not a shortcut: `/`
 * and `/privacy` are exactly the URLs `proxy.ts` negotiates from
 * `Accept-Language`, which is precisely what `x-default` is specified to mean —
 * the version served when no declared language matches the reader.
 *
 * Every alternate set includes its own locale. Google treats a hreflang cluster
 * as invalid unless each page in it lists every version *including itself*, and
 * a one-sided declaration is silently dropped rather than reported.
 */
export function localeAlternates(
  locale: Locale,
  path: string,
  canonicalOverride?: string,
): Metadata["alternates"] {
  const languages: Record<string, string> = Object.fromEntries(
    LOCALES.map((code) => [code, `${SITE_URL}${localeHref(code, path)}`]),
  );
  languages["x-default"] = `${SITE_URL}${path === "/" ? "/" : path}`;

  return {
    canonical: canonicalOverride ?? `${SITE_URL}${localeHref(locale, path)}`,
    languages,
  };
}

/**
 * A **complete** Open Graph block.
 *
 * Complete because Next does not deep-merge metadata across segments: a page
 * that sets `openGraph` replaces its layout's outright, so an override that
 * spells out only `url` silently drops `og:locale`, `og:type` and
 * `og:site_name`. That is not obvious from the code and is invisible until you
 * paste a link into Slack — hence one helper rather than three hand-written
 * objects that will drift.
 *
 * `locale` was hardcoded `en_GB` before this, which mislabelled every Swedish
 * page a visitor might share.
 */
export function siteOpenGraph({
  locale,
  title,
  description,
  url,
}: {
  locale: Locale;
  title: string;
  description: string;
  url: string;
}): NonNullable<Metadata["openGraph"]> {
  return {
    type: "website",
    siteName: "CV Forge",
    title,
    description,
    url,
    locale: OG_LOCALES[locale],
  };
}

/** `SITE_URL` + the locale-prefixed path, absolute — what OG and canonicals need. */
export function absoluteUrl(locale: Locale, path: string): string {
  return `${SITE_URL}${localeHref(locale, path)}`;
}
