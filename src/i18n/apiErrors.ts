import type { ApiErrorCode, ApiErrorParams } from "@/lib/api-errors";
import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries";
import { format, plural, type PluralForms } from "./format";

// `import type` throughout for the API codes: `@/lib/api-errors` pulls in
// `next/server` for `apiError()`, and this module runs in the browser. Type
// imports are erased, so none of that reaches the bundle.

/**
 * Renders one entry of the `errors` slice, which may be a plain string or a
 * `{ one, other }` pair.
 *
 * A pair needs the number its rule selects on, and a body missing `count` is a
 * bug in the route rather than in the translation — so take the plural form and
 * let `format` leave the literal `{count}` visible, the same loud-failure
 * convention `format` already applies to an unknown placeholder.
 */
function render(
  message: string | PluralForms,
  locale: Locale,
  vars: ApiErrorParams,
): string {
  if (typeof message === "string") return format(message, vars);
  if (typeof vars.count !== "number") return format(message.other, vars);
  return plural(locale, message, vars.count, vars);
}

/**
 * Turns an API failure body into a sentence in the reader's language.
 *
 * The parse is deliberately defensive. `res.json()` is typed `any`, the body
 * may be an HTML error page from a proxy, and a tab left open across a deploy
 * can meet a code this build has never heard of. Every one of those paths ends
 * at the fallback rather than at a thrown error inside a `catch` block.
 *
 * **`body.error` is never rendered.** It is the one field guaranteed to hold a
 * readable sentence, which makes reaching for it tempting — and it is
 * permanently English, so rendering it would put an English sentence in a
 * Swedish page at exactly the moment something has already gone wrong. That is
 * the leak this step exists to close. `fallback` is the caller's own translated
 * line ("Kunde inte spara"), which is both localised and more specific about
 * what the user was doing than anything the API could say.
 */
export function translateApiError(
  dict: Dictionary,
  locale: Locale,
  body: unknown,
  fallback?: string,
): string {
  const generic = () => fallback ?? render(dict.errors.generic, locale, {});

  if (!body || typeof body !== "object") return generic();

  const { code, params } = body as { code?: unknown; params?: unknown };
  if (typeof code !== "string" || !(code in dict.errors)) return generic();

  const vars: ApiErrorParams =
    params && typeof params === "object" ? (params as ApiErrorParams) : {};

  return render(dict.errors[code as ApiErrorCode], locale, vars);
}
