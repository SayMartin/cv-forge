import type { Metadata } from "next";
import { LocaleLink } from "@/components/LocaleLink";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { RichText } from "@/i18n/format";
import { getDictionary } from "@/i18n/server";
import { localeAlternates, metaLocale } from "@/lib/seo";

/**
 * The landing page is one of exactly two URLs on this site a crawler can both
 * fetch and index, so it is one of exactly two that carry hreflang. Everything
 * under `(main)` other than `/privacy` is `Disallow`ed in robots.txt and the
 * `(auth)` group is `noindex`; a hreflang cluster on either would never be read.
 */
export async function generateMetadata({
  params,
}: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const locale = metaLocale(lang);
  // `alternates` only. Open Graph is deliberately left to the root layout,
  // whose block already describes this exact URL — and a partial override here
  // would replace it wholesale rather than merging, dropping `og:locale`,
  // `og:type` and `og:site_name` without a word.
  return { alternates: localeAlternates(locale, "/") };
}

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  const { landing, nav } = await getDictionary();

  // The numerals are not language, so they stay here rather than being repeated
  // in both dictionaries. The steps are named keys in the dictionary — an array
  // there would let a translation ship three of four and still compile.
  const steps: { n: string; title: string; body: string; tag?: string }[] = [
    { n: "01", ...landing.steps.import },
    { n: "02", ...landing.steps.library },
    { n: "03", ...landing.steps.build },
    { n: "04", ...landing.steps.export },
  ];

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="bg-(--cl-nav) text-(--cl-nav-text) py-14 px-6">
        {/* 4xl to match the app pages. Harmless here: the h1 breaks manually and
            the paragraph keeps its own `max-w-lg`, so nothing gets a longer line
            — the section just stops being narrower than everything after it. */}
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            {landing.hero.titleLine1}
            <br />
            {landing.hero.titleLine2}
          </h1>
          <p
            className="text-lg leading-relaxed max-w-lg mx-auto"
            style={{ color: "#8FA87A" }}
          >
            {landing.hero.subtitle}
          </p>
          {session ? (
            <LocaleLink
              href="/cvs"
              className="inline-block bg-(--cl-accent) text-white rounded-lg px-7 py-3 text-sm font-semibold hover:bg-(--cl-accent-hov) transition-colors"
            >
              {landing.hero.ctaSignedIn}
            </LocaleLink>
          ) : (
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <LocaleLink
                href="/sign-up"
                className="inline-block bg-(--cl-accent) text-white rounded-lg px-7 py-3 text-sm font-semibold hover:bg-(--cl-accent-hov) transition-colors"
              >
                {landing.hero.ctaSignUp}
              </LocaleLink>
              <LocaleLink
                href="/sign-in"
                className="text-sm hover:text-white transition-colors"
                style={{ color: "#8FA87A" }}
              >
                {landing.hero.ctaSignIn}
              </LocaleLink>
            </div>
          )}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-(--cl-bg)">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-(--cl-muted) text-center mb-14">
            {landing.howItWorks}
          </h2>
          {/* Two columns rather than a taller single one. Stretching these four
              paragraphs across the wider section would push them past a
              comfortable line length; splitting them keeps each body around the
              measure it had at max-w-2xl and spends the width on the layout. */}
          <ol className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {steps.map((step) => (
              <li key={step.n} className="flex gap-6 items-start">
                <span
                  className="text-3xl font-bold tabular-nums leading-none shrink-0 w-10 text-right select-none"
                  style={{ color: "var(--cl-border)" }}
                >
                  {step.n}
                </span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-(--cl-text)">
                      {step.title}
                    </h3>
                    {step.tag && (
                      <span className="text-sm tracking-wider px-2 py-0.5 rounded-full bg-(--cl-pill) text-(--cl-muted)">
                        {step.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-(--cl-muted) leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Your data ───────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-(--cl-bg) border-t border-(--cl-border)">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start gap-5">
          <span className="text-2xl shrink-0" aria-hidden="true">🔒</span>
          {/* The container widens with the rest of the page, but this is one long
              paragraph — it keeps a reading measure of its own rather than running
              the full width. */}
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-base font-semibold text-(--cl-text)">
              {landing.data.title}
            </h2>
            {/* Both paragraphs put their inline markup in the middle of a
                sentence, so the sentence stays one dictionary string with a
                placeholder and the translation decides where the markup lands.
                In Swedish {settings} is followed by a comma English does not
                have — which is exactly what a split Before/After key pair could
                not express. */}
            <p className="text-sm text-(--cl-muted) leading-relaxed">
              <RichText
                template={landing.data.deleteBody}
                values={{
                  settings: (
                    <strong className="text-(--cl-text) font-medium">
                      {nav.settings}
                    </strong>
                  ),
                }}
              />
            </p>
            <p className="text-sm text-(--cl-muted) leading-relaxed">
              <RichText
                template={landing.data.privacyBody}
                values={{
                  privacyPolicy: (
                    <LocaleLink
                      href="/privacy"
                      className="text-(--cl-accent) underline underline-offset-2"
                    >
                      {landing.data.privacyLink}
                    </LocaleLink>
                  ),
                }}
              />
            </p>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────── */}
      {!session && (
        <section className="py-16 px-6 bg-(--cl-surface) border-t border-(--cl-border)">
          <div className="max-w-md mx-auto text-center space-y-5">
            <h2 className="text-2xl font-bold text-(--cl-text) tracking-tight">
              {landing.cta.title}
            </h2>
            <p className="text-sm text-(--cl-muted)">{landing.cta.body}</p>
            <LocaleLink
              href="/sign-up"
              className="inline-block bg-(--cl-accent) text-white rounded-lg px-7 py-3 text-sm font-semibold hover:bg-(--cl-accent-hov) transition-colors"
            >
              {landing.cta.button}
            </LocaleLink>
          </div>
        </section>
      )}
    </div>
  );
}
