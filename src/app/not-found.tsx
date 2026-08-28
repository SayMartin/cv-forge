import { cookies } from "next/headers";
import { Geist } from "next/font/google";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/i18n/config";
import { dictionaryFor } from "@/i18n/dictionaries";
import { localeHref } from "@/i18n/routing";
import "./globals.css";

/**
 * The app's 404, for `notFound()` calls — a CV id that is not yours, or no
 * longer exists.
 *
 * **It sits here, at `src/app/`, and not under `[lang]` — that was verified, not
 * assumed.** A `not-found.tsx` anywhere inside the locale tree is never rendered
 * at all: Next falls through to its own built-in page. Only this position works
 * when the root layout lives under a top-level dynamic segment, which is the
 * situation the docs describe as making a consistent 404 "harder".
 *
 * Three consequences follow from being outside the root layout, and each is
 * handled here rather than inherited:
 *
 * 1. **No stylesheet.** Next wraps this in a bare `<html><body>` of its own, so
 *    `globals.css` and the font are imported directly. Without them the page
 *    renders as unstyled black-on-white.
 * 2. **No `next/root-params`.** The locale comes from the cookie `proxy.ts`
 *    always sets — which is exactly what that cookie exists for.
 * 3. **No `<html lang>`.** The wrapper is Next's and cannot be reached from
 *    here, so `lang` is set on the content instead. That is what a screen
 *    reader needs; it just cannot be set on the document element.
 *
 * It does **not** catch URLs matching no route at all (`/sv/nonsense`), which
 * still get Next's built-in page. Covering that needs `experimental.globalNotFound`
 * plus an `app/global-not-found.tsx` — not worth an experimental flag on a repo
 * that deploys straight to production.
 */

// The same face the root layout loads, so the 404 does not arrive in a
// different typeface from the page the visitor came from.
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export default async function NotFound() {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  const { common } = dictionaryFor(locale);

  return (
    <main
      lang={locale}
      className={`${geistSans.variable} min-h-screen flex items-center justify-center bg-(--cl-bg) px-6`}
    >
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-sm border border-(--cl-border) space-y-4 text-center">
        <p className="text-sm font-medium tracking-widest uppercase text-(--cl-muted)">
          404
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-(--cl-text)">
          {common.notFound.title}
        </h1>
        <p className="text-sm text-(--cl-muted)">{common.notFound.body}</p>
        {/* A plain <a>, not LocaleLink: this page renders outside the locale
            tree, so there is no `[lang]` segment for `useLocale()` to read. The
            href is built from the cookie locale instead. */}
        <a
          href={localeHref(locale, "/")}
          className="inline-block text-sm text-(--cl-accent) font-medium hover:underline"
        >
          {common.notFound.back}
        </a>
      </div>
    </main>
  );
}
