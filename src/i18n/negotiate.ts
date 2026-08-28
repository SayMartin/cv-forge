// Accept-Language → Locale.
//
// Hand-rolled rather than `negotiator` + `@formatjs/intl-localematcher`, which
// is what the Next guide reaches for. Those exist to resolve BCP-47 lookup
// against a locale set with regional variants ("en-US" vs "en-GB" vs "en"),
// where filtering-vs-lookup semantics genuinely differ. Our set is ["sv", "en"]
// with no variants, so the entire decision is "sort by q, then compare primary
// subtags" — twenty lines against two dependencies in `proxy.ts`, which runs on
// every page request and which the Next docs explicitly warn should not lean on
// shared modules.
//
// Two cases this must get right, and which naive implementations usually do not:
//
//   "sv-SE,sv;q=0.9,en;q=0.8"  → "sv"   (match on the primary subtag, not the
//                                        full tag, or sv-SE falls through to en)
//   "*"                        → null   (the wildcard expresses "any", which is
//                                        not a preference; it must fall through
//                                        to DEFAULT_LOCALE rather than pick the
//                                        first locale we happen to support)
//
// Revisit if a third locale with regional variants is ever added.

import { isLocale, type Locale } from "./config";

/**
 * The caller's most-preferred supported locale, or `null` when the header is
 * missing, malformed, or expresses no preference we can honour.
 *
 * Returning `null` rather than DEFAULT_LOCALE keeps "no opinion" distinguishable
 * from "explicitly wants English" at the call site.
 */
export function pickLocale(acceptLanguage: string | null | undefined): Locale | null {
  if (!acceptLanguage) return null;

  const ranked = acceptLanguage
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="))
        ?.slice(2);
      const quality = q === undefined ? 1 : Number.parseFloat(q);
      // `index` is the tiebreaker: RFC 9110 gives equal-q tags no ordering, but
      // header order is the author's intent and Array.prototype.sort is only
      // guaranteed stable for the comparator's own ties, not across the map.
      return { tag: tag.trim().toLowerCase(), quality, index };
    })
    // q=0 means "explicitly unacceptable", not "least preferred". NaN from a
    // malformed q is dropped for the same reason: we cannot rank what we cannot read.
    .filter((entry) => entry.tag.length > 0 && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  for (const { tag } of ranked) {
    if (tag === "*") continue;
    const primary = tag.split("-")[0];
    if (isLocale(primary)) return primary;
  }

  return null;
}
