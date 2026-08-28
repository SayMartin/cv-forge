import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/i18n/config";
import { pickLocale } from "@/i18n/negotiate";

/**
 * Locale routing.
 *
 * Every page lives under `app/[lang]`, so a request without a locale segment has
 * nowhere to land. This decides which one it gets.
 *
 * `proxy` is Next 16's rename of `middleware`. It runs before rendering and,
 * per the docs, may be deployed to a CDN — so it holds no imports beyond two
 * dependency-free string modules, and never touches Prisma. That last point is
 * the constraint the whole design bends around: the durable preference lives in
 * `User.locale`, which this file cannot read, so it is mirrored into a cookie.
 *
 * Precedence, in order:
 *
 *   1. The URL already names a locale        → serve it, and correct the cookie.
 *   2. Bare path, cookie says something      → redirect to the cookie's locale.
 *   3. Bare path, no cookie                  → negotiate Accept-Language, redirect,
 *                                              and set the cookie so this runs once.
 *   4. Nothing matched                       → DEFAULT_LOCALE.
 *
 * Rule 1 is why a shared link works: **the URL always wins.** Someone who opens
 * `/en/cvs/<id>` sent to them by a colleague gets English, even when their own
 * account is set to Swedish. The account preference reasserts itself on the next
 * bare navigation and never fights a deliberate deep link.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Belt and braces: the matcher below excludes `/_next`, but Next still routes
  // `/_next/data/*` through the proxy in some configurations.
  if (pathname.startsWith("/_next")) return;

  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const segment = pathname.split("/")[1];

  // ── 1. The URL names a locale ──────────────────────────────────────────────
  if (isLocale(segment)) {
    if (cookieLocale === segment) return;
    // The cookie follows the URL, not the other way round, so that a visitor who
    // deliberately opened the other language keeps getting it on bare links.
    const response = NextResponse.next();
    setLocaleCookie(response, segment, request);
    return response;
  }

  // ── 2/3. Bare path — pick a locale and redirect ────────────────────────────
  const locale: Locale = isLocale(cookieLocale)
    ? cookieLocale
    : pickLocale(request.headers.get("accept-language")) ?? DEFAULT_LOCALE;

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  url.search = search;

  // 307, never 308. A permanent redirect would pin `/ → /en` in every
  // intermediate cache and in Google's index, which is simply wrong: the target
  // legitimately varies by header and by cookie. The hreflang cluster, not a
  // permanent redirect, is what tells a crawler how the locales relate.
  const response = NextResponse.redirect(url, 307);

  // Cloudflare fronts this origin. HTML is not cached by default, but if a Cache
  // Rule is ever added, a `/ → /sv` redirect cached and served to every visitor
  // is exactly the failure that is invisible in development and obvious in
  // production. One header now is cheaper than that afternoon.
  response.headers.set("Vary", "Accept-Language, Cookie");

  setLocaleCookie(response, locale, request);
  return response;
}

function setLocaleCookie(
  response: NextResponse,
  locale: Locale,
  request: NextRequest,
) {
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    // Not httpOnly: this is a display preference, not a credential, and keeping
    // it readable lets the client correct it without a round trip.
    httpOnly: false,
    secure: request.nextUrl.protocol === "https:",
  });
}

export const config = {
  // Everything except API routes, Next's own assets, the metadata file routes,
  // and anything with a file extension. `robots.txt` and `sitemap.xml` are
  // origin-scoped by spec and must not acquire a locale prefix.
  matcher: [
    "/((?!api|_next/static|_next/image|_next/data|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
