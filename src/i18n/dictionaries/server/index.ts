import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import { en, type ServerDictionary } from "./en";
import { sv } from "./sv";

export type { ServerDictionary, EmailKind } from "./en";

/**
 * `Record<Locale, ServerDictionary>`, so a third entry in `LOCALES` fails to
 * compile here rather than resolving to `undefined` and sending a blank email.
 */
const SERVER_DICTIONARIES: Record<Locale, ServerDictionary> = { en, sv };

export function serverDictionaryFor(locale: Locale): ServerDictionary {
  return SERVER_DICTIONARIES[locale];
}

/**
 * Which language to write to this account in.
 *
 * Takes the raw column rather than a `Locale`, because that is what the caller
 * has. `user.locale` is nullable *and* `input: true`, so the value is both
 * "never chose" and client-supplied — it is validated on every read, here
 * included. NULL means no preference, and an account with no preference has
 * always received English.
 *
 * Resolving the locale and picking the dictionary are two functions rather than
 * one, because `renderEmail` needs the locale itself for `<html lang>`.
 */
export function emailLocale(locale: string | null | undefined): Locale {
  return isLocale(locale) ? locale : DEFAULT_LOCALE;
}
