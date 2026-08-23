/**
 * Canonical public origin, used for metadata, robots.txt and the sitemap.
 *
 * Hardcoded rather than read from `BETTER_AUTH_URL`: `robots.ts` and
 * `sitemap.ts` are rendered at **build** time, and the Docker build is not
 * given the environment file (see ARCHITECTURE.md -> Deploy). An env lookup
 * here would silently bake `undefined` into the production sitemap.
 */
export const SITE_URL = "https://cv-forge.appfinningar.se";
