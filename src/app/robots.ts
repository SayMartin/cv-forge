import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Everything behind sign-in is disallowed: those routes redirect logged-out
 * visitors to /sign-in, so crawling them yields nothing but wasted budget.
 *
 * The auth pages themselves are deliberately absent — they carry `noindex`
 * (see (auth)/layout.tsx), and a crawler that is forbidden from fetching a
 * page never gets to read the tag telling it not to index it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/cvs", "/content", "/settings", "/import"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
