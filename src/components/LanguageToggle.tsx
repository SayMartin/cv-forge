"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { LOCALES, type Locale } from "@/i18n/config";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { format } from "@/i18n/format";
import { swapLocale } from "@/i18n/routing";
import { useLocale } from "@/i18n/useLocale";

/**
 * The language switch, sitting immediately right of the wordmark in the navbar.
 *
 * **Flag *and* language code, never a flag on its own.** A flag is a country,
 * not a language: the Swedish flag leaves out Finland-Swedish speakers, and a
 * Union Jack standing for "English" is a claim nobody needs to defend. The code
 * is what actually identifies the choice; the flag is what makes it findable at
 * a glance for someone who cannot yet read the page.
 *
 * **Links, not buttons.** Switching language is a change of address — each
 * locale of a page is a real, separate, shareable URL. As links they are
 * right-clickable, work with the back button, and survive JavaScript failing.
 * `aria-current="true"` for the same reason `aria-pressed` would be wrong: these
 * mark which variant of the current resource is showing, not a pressed state.
 *
 * **A plain `<a>`, so the switch is a full page load.** This is the one place
 * the app deliberately leaves `LocaleLink` behind — it builds an href for the
 * *current* locale, which is precisely what must not happen here. `next/link`
 * would work, but the Next docs state that layouts do not re-render on
 * navigation, and `<html lang>` is set by the root layout: a client-side switch
 * risks leaving the document declaring the old language while showing the new
 * one. That is invisible on screen and wrong for every screen reader. A document
 * request also guarantees `proxy.ts` sees it and rewrites the locale cookie.
 * The cost is one page load on a rare, deliberate action.
 */
export function LanguageToggle() {
  const current = useLocale();
  const pathname = usePathname();
  // usePathname() drops the query string, and it carries real state:
  // /content?tab=skills&from=<id> must survive the switch.
  const searchParams = useSearchParams();
  const { language } = useDictionary().nav;

  const query = searchParams.toString();

  return (
    <div
      // A group label, so the two links are not announced as loose navigation.
      role="group"
      aria-label={language.label}
      className="flex items-center gap-2"
    >
      {LOCALES.map((locale) => {
        const active = locale === current;
        const name = language.names[locale];

        return (
          <a
            key={locale}
            href={swapLocale(pathname, locale) + (query ? `?${query}` : "")}
            hrefLang={locale}
            aria-current={active ? "true" : undefined}
            aria-label={format(active ? language.current : language.switchTo, {
              language: name,
            })}
            // The navbar's own active-marker idiom: a border-bottom bar plus a
            // weight change, with a transparent border of the same width on the
            // inactive one so nothing shifts. Colour alone cannot carry it here
            // — see the note on NavLink.
            className={`flex items-center gap-1 border-b-2 py-0.5 text-sm transition-colors ${
              active
                ? "border-(--cl-nav-muted) text-white font-medium"
                : "border-transparent text-(--cl-nav-text) hover:text-white"
            }`}
          >
            <Flag locale={locale} />
            <span aria-hidden="true">{locale.toUpperCase()}</span>
          </a>
        );
      })}
    </div>
  );
}

/**
 * Inline SVG rather than an emoji flag or an image: emoji flags do not render at
 * all on Windows, and an <img> would be a network request for 200 bytes of
 * rectangles.
 *
 * Each flag keeps its own proportions (Sweden is 16:10, the Union Flag 2:1)
 * rather than being squeezed into a shared box — only `width` is set, so the
 * viewBox decides the height. `aria-hidden`, because the link's own label
 * already says which language it is.
 */
function Flag({ locale }: { locale: Locale }) {
  const shared = {
    width: 18,
    "aria-hidden": true,
    focusable: "false",
    className: "shrink-0 rounded-[1px]",
  } as const;

  if (locale === "sv") {
    return (
      <svg viewBox="0 0 16 10" {...shared}>
        <rect width="16" height="10" fill="#006AA7" />
        <rect y="4" width="16" height="2" fill="#FECC00" />
        <rect x="5" width="2" height="10" fill="#FECC00" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 60 30" {...shared}>
      {/* Counterchanges the red diagonals so each is offset the correct way
          round in its quadrant — the detail that separates a Union Flag from
          the upside-down one. */}
      <clipPath id="cvforge-union-flag">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path
        d="M0,0 L60,30 M60,0 L0,30"
        clipPath="url(#cvforge-union-flag)"
        stroke="#C8102E"
        strokeWidth="4"
      />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}
