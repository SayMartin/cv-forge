import type { Locale } from "@/i18n/config";
import { en, type Dictionary } from "./en";
import { sv } from "./sv";

export type { Dictionary };

/**
 * `Record<Locale, Dictionary>`, so a new locale added to `LOCALES` fails to
 * compile here until its dictionary exists — rather than resolving to
 * `undefined` and blanking every string on the page.
 */
const DICTIONARIES: Record<Locale, Dictionary> = { en, sv };

/**
 * Both dictionaries are imported statically rather than behind `import()`.
 *
 * The usual reason to load them dynamically is bundle size, and that does not
 * apply: this module is only ever reached from the server, and the client
 * receives the active dictionary as a serialised prop through
 * `DictionaryProvider` — never as an import. So the "cost" of the static import
 * is one extra object in server memory, in exchange for synchronous access and
 * a `Record` the type checker can actually check.
 *
 * Keep it that way. A Client Component importing this file would pull *both*
 * languages into the browser bundle.
 */
export function dictionaryFor(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
