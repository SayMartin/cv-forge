import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { lang } from "next/root-params";
import { SITE_URL } from "@/lib/site";
import { absoluteUrl, metaDictionary, metaLocale, siteOpenGraph } from "@/lib/seo";
import { LOCALES } from "@/i18n/config";
import { DictionaryProvider } from "@/i18n/DictionaryProvider";
import { getDictionary } from "@/i18n/server";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * `generateMetadata`, not a static `metadata` const, because the description is
 * user-facing text in a search result and the OG locale mislabels the document
 * if it is wrong — both vary by language.
 *
 * The locale comes from `params`, not `next/root-params`. The docs guarantee
 * root-params in Server Components and a metadata function is not one; `params`
 * carries `lang` here because every route lives under `app/[lang]`.
 *
 * Deliberately **no `alternates` and no `openGraph.url` here.** Metadata set on
 * a layout is inherited by every page under it that does not override it, so a
 * canonical here would have `/sv/cvs` claiming to be `/sv`. Those two fields
 * describe one specific URL, so they belong on the page that is that URL — see
 * `(main)/page.tsx` and `(main)/privacy/page.tsx`. What is inherited is what is
 * genuinely site-wide: the title template, the description, and the OG locale.
 */
export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang: raw } = await params;
  const locale = metaLocale(raw);
  const { meta } = metaDictionary(raw);

  return {
    // Required for the absolute URLs Open Graph needs; without it Next emits
    // relative ones and warns at build time.
    metadataBase: new URL(SITE_URL),
    title: {
      template: "%s | CV Forge",
      default: "CV Forge",
    },
    description: meta.description,
    openGraph: siteOpenGraph({
      locale,
      title: "CV Forge",
      description: meta.description,
      url: absoluteUrl(locale, "/"),
    }),
    twitter: {
      card: "summary",
      title: "CV Forge",
      description: meta.description,
    },
  };
}

/**
 * Not *mandatory* — that only applies under `cacheComponents`, which
 * `next.config.ts` does not enable — and right now it prerenders nothing:
 * `app/not-found.tsx` reads `cookies()` to localise the 404, and because the
 * not-found boundary belongs to every route's tree, that makes the whole app
 * dynamic. See ARCHITECTURE.md → "The 404: it must live outside `[lang]`" for
 * the trade and the one-line way to reverse it.
 *
 * It stays because it is what enumerates the locales for the build, and it is
 * what makes the four `(auth)` pages prerender again the moment that read goes
 * away. Everything under `(main)` is dynamic regardless — that group's layout
 * calls `headers()` to read the session.
 */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ lang: locale }));
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={await lang()}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* `children` is passed in from a Server Component, so wrapping the tree
            in a client provider does not pull any of it across the boundary —
            it stays server-rendered and only the dictionary itself is
            serialised. Server Components use `getDictionary()` directly. */}
        <DictionaryProvider dictionary={await getDictionary()}>
          {children}
        </DictionaryProvider>
      </body>
    </html>
  );
}
