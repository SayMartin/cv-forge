"use client";

import { usePathname } from "next/navigation";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";

/**
 * The active locale, for Client Components.
 *
 * Derived from the URL rather than passed down through a provider, because the
 * URL is already the authority for the current render (see `proxy.ts`) and a
 * second copy in React state is a second thing that can disagree with it. There
 * is nothing to seed, nothing to serialise, and a route transition updates it
 * for free.
 *
 * `next/root-params` is the Server Component equivalent and cannot be used here
 * — it is documented as unavailable in Client Components.
 *
 * The DEFAULT_LOCALE fallback is unreachable in practice: every page lives under
 * `app/[lang]`, so a rendered component always has a locale segment above it.
 */
export function useLocale(): Locale {
  const pathname = usePathname();
  const segment = pathname.split("/")[1];
  return isLocale(segment) ? segment : DEFAULT_LOCALE;
}
