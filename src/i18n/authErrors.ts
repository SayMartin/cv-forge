// Better Auth's own error messages, translated.
//
// The library returns `{ code, message }` where `message` is an English sentence
// baked into `@better-auth/core`. Rendering that message is the one English leak
// a Swedish user meets on the most important screen in the app, and it is not
// fixable by translating our own strings — the text never passes through this
// codebase.
//
// So the *code* is what gets read, and the message is discarded. That is better
// than a translation lookup keyed on English text for a second reason: the
// sign-in page used to compare `error === "Email not verified"`, which breaks
// silently the day the library rewords the sentence.

/**
 * The codes these forms can actually produce, and therefore the ones worth
 * writing sentences for. Everything else falls through to `fallback` — in the
 * reader's language, which is the point. A generic Swedish message beats a
 * precise English one here.
 *
 * Deliberately *not* checked against Better Auth's `APIErrorCode` union. Doing
 * so would mean importing from `@better-auth/core`, which this project does not
 * depend on directly — it is hoisted today and need not be tomorrow. The cost of
 * skipping the check is small and self-correcting: if the library renames a
 * code, that case stops matching and the user sees `fallback` instead of a
 * tailored sentence. Nothing breaks and nothing leaks English.
 */
export const AUTH_ERROR_CODES = [
  // sign-in
  "EMAIL_NOT_VERIFIED",
  "INVALID_EMAIL_OR_PASSWORD",
  "INVALID_EMAIL",
  // sign-up
  "USER_ALREADY_EXISTS",
  "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
  "PASSWORD_TOO_SHORT",
  "PASSWORD_TOO_LONG",
  "FAILED_TO_CREATE_USER",
  // reset-password
  "INVALID_TOKEN",
  "TOKEN_EXPIRED",
  // social
  "SOCIAL_ACCOUNT_ALREADY_LINKED",
] as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];

/**
 * The dictionary shape. `Record<AuthErrorCode, string>` is what makes adding a
 * code to the list above a compile error in *both* locale files rather than a
 * quiet English gap in one of them.
 */
export type AuthErrors = Record<AuthErrorCode, string> & {
  /** Every code not listed above, plus a failure with no code at all. */
  fallback: string;
};

function isAuthErrorCode(value: unknown): value is AuthErrorCode {
  return (
    typeof value === "string" &&
    (AUTH_ERROR_CODES as readonly string[]).includes(value)
  );
}

/**
 * Turn whatever `authClient` returned into a sentence in the reader's language.
 *
 * Takes the errors slice rather than the whole dictionary so this module has no
 * import from `dictionaries/`, which would otherwise be a cycle: the English
 * `auth` slice imports `AuthErrors` from here.
 *
 * `code` is typed `string | undefined` by Better Auth, not as its own union, so
 * the narrowing has to happen at runtime regardless.
 */
export function authErrorMessage(
  errors: AuthErrors,
  error: { code?: string } | null | undefined,
): string {
  return isAuthErrorCode(error?.code) ? errors[error.code] : errors.fallback;
}
