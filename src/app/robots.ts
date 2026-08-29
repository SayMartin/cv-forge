import type { MetadataRoute } from "next";
import { LOCALES } from "@/i18n/config";
import { localeHref } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";

/**
 * Everything behind sign-in is disallowed: those routes redirect logged-out
 * visitors to /sign-in, so crawling them yields nothing but wasted budget.
 *
 * **Written out per locale rather than wildcarded.** Since every page moved
 * under `/[lang]`, the bare paths these used to name exist only as redirects,
 * a wildcard over the locale segment would have been the tempting fix — but
 * path wildcards are a Google/Bing extension, not part of the robots.txt
 * standard, and a crawler that does not implement them reads the rule as a
 * literal path and matches nothing at all. Two locales times four paths is
 * eight lines that every crawler understands.
 *
 * The un-prefixed paths stay in the list. They are only redirects now, but a
 * crawler that has one from before this change should be told not to follow it.
 *
 * The auth pages are deliberately absent — they carry `noindex` (see
 * `(auth)/layout.tsx`), and a crawler forbidden from fetching a page never gets
 * to read the tag telling it not to index it.
 */
const PRIVATE_PATHS = ["/cvs", "/content", "/settings", "/import"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        ...PRIVATE_PATHS,
        ...LOCALES.flatMap((code) => PRIVATE_PATHS.map((path) => localeHref(code, path))),
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
