import type { MetadataRoute } from "next";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/config";
import { localeHref } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";

/**
 * The complete public surface. Everything else either requires a session or is
 * an auth page we do not want in the index.
 *
 * **Three entries, not four.** The landing page is a genuine translation pair,
 * so both `/en` and `/sv` are listed and each declares the other — Google treats
 * a hreflang cluster as invalid unless every member lists every version,
 * including itself. `/privacy` is *not* a pair: its prose is English in both
 * locales, so `/sv/privacy` canonicalises to `/en/privacy` and only the English
 * URL belongs here. A sitemap listing a non-canonical URL asks the crawler to
 * index a page that then disclaims itself.
 *
 * No `lastModified`: it would be evaluated at build time and so claim both pages
 * changed on every deploy, which is worse than omitting it.
 *
 * `x-default` points at the un-prefixed path, which is what `proxy.ts`
 * negotiates from `Accept-Language` — exactly what `x-default` is specified to
 * mean.
 */
const homeLanguages: Record<string, string> = {
  ...Object.fromEntries(LOCALES.map((code) => [code, `${SITE_URL}${localeHref(code, "/")}`])),
  "x-default": `${SITE_URL}/`,
};

export default function sitemap(): MetadataRoute.Sitemap {
  const privacy = `${SITE_URL}${localeHref(DEFAULT_LOCALE, "/privacy")}`;

  return [
    ...LOCALES.map((code) => ({
      url: `${SITE_URL}${localeHref(code, "/")}`,
      changeFrequency: "monthly" as const,
      priority: 1,
      alternates: { languages: homeLanguages },
    })),
    {
      url: privacy,
      changeFrequency: "yearly" as const,
      priority: 0.3,
      // No alternates: there is only one version of this document.
    },
  ];
}
