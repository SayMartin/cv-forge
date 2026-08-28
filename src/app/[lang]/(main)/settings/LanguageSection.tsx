"use client";

import { usePathname } from "next/navigation";
import { LOCALES, type Locale } from "@/i18n/config";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { persistLocale } from "@/i18n/persistLocale";
import { swapLocale } from "@/i18n/routing";
import { useLocale } from "@/i18n/useLocale";

/**
 * The account's language preference, on the settings page.
 *
 * Deliberately the same value the navbar toggle writes — not a second, separate
 * setting. Two controls for one preference is fine; two preferences that can
 * disagree is a support question. What this adds over the toggle is
 * discoverability and a plain statement of what the choice actually does, which
 * a pair of flags cannot carry.
 *
 * Buttons here, where the navbar has links. The navbar's job is *navigation* —
 * each locale of a page is a real URL worth right-clicking. This one's job is
 * changing a stored setting; it just happens to reload the page afterwards so
 * the change is visible. `aria-pressed` follows from that, where the navbar
 * correctly uses `aria-current`.
 */
export function LanguageSection() {
  const current = useLocale();
  const pathname = usePathname();
  const { settings } = useDictionary();

  function choose(locale: Locale) {
    if (locale === current) return;
    persistLocale(locale);
    // A full navigation, for the same reason the navbar toggle is a plain <a>:
    // `<html lang>` is set by the root layout, and layouts do not re-render on
    // client-side navigation.
    //
    // `assign()` rather than setting `.href` — identical behaviour, but the
    // assignment form trips `react-hooks/immutability`, which reads it as
    // mutating a value defined outside the component.
    window.location.assign(swapLocale(pathname, locale));
  }

  return (
    <div className="bg-white rounded-xl border border-(--cl-border) p-5 space-y-4">
      <p className="text-sm text-(--cl-muted)">{settings.language.description}</p>
      <div className="flex flex-wrap gap-3">
        {LOCALES.map((locale) => {
          const active = locale === current;
          return (
            <button
              key={locale}
              type="button"
              onClick={() => choose(locale)}
              aria-pressed={active}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
                active
                  ? "border-(--cl-accent) bg-(--cl-pill) text-(--cl-text) font-medium"
                  : "border-(--cl-border) text-(--cl-muted) hover:text-(--cl-text) hover:border-(--cl-muted) cursor-pointer"
              }`}
            >
              {/* The autonym, so the option is legible to someone who cannot
                  read the language the page is currently in. */}
              <span lang={locale}>{LANGUAGE_AUTONYMS[locale]}</span>
              {active && (
                <span className="text-(--cl-muted) font-normal">
                  {settings.language.currentBadge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Each language's name *in itself* — not translated, and so not in the
 * dictionary. "Svenska" is Svenska in every locale; a translated list would put
 * "Swedish" in front of someone who is here because they cannot read English.
 */
const LANGUAGE_AUTONYMS: Record<Locale, string> = {
  sv: "Svenska",
  en: "English",
};
