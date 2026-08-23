import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * The complete public surface. Everything else either requires a session or
 * is an auth page we do not want in the index.
 *
 * No `lastModified`: it would be evaluated at build time and so claim both
 * pages changed on every deploy, which is worse than omitting it.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // Trailing slash so this matches the canonical the root layout emits.
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
