import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  localeCookieOptions,
  type Locale,
} from "@/i18n/config";
import { localeHref } from "@/i18n/routing";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/locale/resume?next=/cvs — pick the language back up after signing in.
 *
 * This is the only place that can read the session, write the cookie, and
 * redirect in a single hop, which is exactly what the moment after sign-in
 * needs: the session did not exist when the page was rendered, so nothing
 * earlier could have known the account's language. Both doors go through it —
 * the email/password form navigates here, and Google's OAuth `callbackURL`
 * points at it.
 *
 * A NULL `User.locale` means the account has never chosen, and then this does
 * **not** overrule the device: the cookie the browser already has (negotiated
 * from `Accept-Language` on the first visit) stands. Only an explicit account
 * preference wins.
 */
export async function GET(request: NextRequest) {
  const next = safeNext(
    request.nextUrl.searchParams.get("next"),
    request.nextUrl.origin,
  );

  const session = await auth.api.getSession({ headers: await headers() });
  // Client-supplied at sign-up via Better Auth's `input: true`, so it is
  // validated on the way out rather than trusted.
  const accountLocale = isLocale(session?.user.locale) ? session.user.locale : null;

  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale: Locale =
    accountLocale ?? (isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE);

  const response = NextResponse.redirect(
    new URL(localeHref(locale, next), request.nextUrl.origin),
    302,
  );
  // A 302 is cacheable by default, and this one depends on who is asking.
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(
    LOCALE_COOKIE,
    locale,
    localeCookieOptions(request.nextUrl.protocol === "https:"),
  );
  return response;
}

/**
 * `next` arrives from the query string and the response is a redirect, so
 * without this the endpoint is an open redirect that any phishing link can point
 * at another origin while wearing this domain.
 *
 * Checking the raw string is not enough, and testing showed exactly why:
 * `/..//evil.com` passes every prefix test, and then the URL parser resolves the
 * `..` away and leaves the path `//evil.com`. That particular case is not
 * exploitable — the `Location` header carries an absolute URL whose host is
 * ours, so the browser stays here — but the guard only survives on a technicality
 * one refactor away from being lost.
 *
 * So: reject the obvious forms, then **normalise and re-check**. `..` segments,
 * encoded slashes and anything else the parser rewrites are all covered by
 * looking at what actually comes out.
 *
 *   `//evil.com`     protocol-relative
 *   `/\evil.com`     treated as protocol-relative by browsers that fold the backslash
 *   `/..//evil.com`  normalises to a protocol-relative path
 */
function safeNext(value: string | null, origin: string): string {
  if (!value || !value.startsWith("/")) return "/";
  if (value.startsWith("//") || value.startsWith("/\\")) return "/";

  let url: URL;
  try {
    url = new URL(value, origin);
  } catch {
    return "/";
  }
  if (url.origin !== origin) return "/";

  const path = `${url.pathname}${url.search}`;
  return path.startsWith("//") ? "/" : path;
}
