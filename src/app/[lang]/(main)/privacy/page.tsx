import type { Metadata } from "next";
import { LocaleLink } from "@/components/LocaleLink";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { localeHref } from "@/i18n/routing";
import { siteOpenGraph } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

/**
 * The one page whose two locales are **not** a translation pair.
 *
 * The prose here is legal text and is deliberately out of scope for
 * translation, so `/sv/privacy` serves English wording inside Swedish chrome.
 * Declaring `hreflang="sv"` for that would tell Google "here is the Swedish
 * version", which it is not — Google would fold the pair as near-duplicates and
 * pick one arbitrarily. So both URLs canonicalise to `/en/privacy`, and only
 * that one is in the sitemap. The Swedish visitor still gets Swedish navigation
 * and footer; only the search engine is told which copy counts.
 *
 * `alternates.languages` is still emitted, and still points both `en` and `sv`
 * at the English URL. That is not a contradiction: it says the two requests
 * resolve to one document, which is exactly true.
 *
 * The title and description stay English for the same reason the body does —
 * they describe an English document.
 */
const CANONICAL = `${SITE_URL}${localeHref(DEFAULT_LOCALE, "/privacy")}`;

const TITLE = "Privacy Policy";
const DESCRIPTION =
  "What CV Forge stores about you, who else can see it, how long it is kept, and how to get it deleted.";

export function generateMetadata(): Metadata {
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: {
      canonical: CANONICAL,
      // Both point at the English URL. Not a contradiction: this says the two
      // requests resolve to one document, which is exactly true.
      languages: { en: CANONICAL, sv: CANONICAL, "x-default": CANONICAL },
    },
    // Spelled out in full because a partial `openGraph` replaces the layout's
    // rather than merging — and this document is English whichever locale
    // served it, so it must not inherit the Swedish description either.
    openGraph: siteOpenGraph({
      locale: DEFAULT_LOCALE,
      title: TITLE,
      description: DESCRIPTION,
      url: CANONICAL,
    }),
  };
}

// Shown at the top and used as the "last updated" date. Bump it whenever the
// substance of this page changes — a policy dated before the practice it
// describes is worse than no date at all.
const LAST_UPDATED = "22 August 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-(--cl-muted)">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-(--cl-text)">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  // `lang="en"` on the <main> because the prose is English regardless of which
  // locale served the page. Without it `<html lang="sv">` wraps English text and
  // a Swedish screen reader pronounces English words with Swedish phonemes —
  // unintelligible. Correct markup whatever Google decides about the canonical.
  return (
    <main lang="en" className="max-w-3xl mx-auto px-4 py-12 space-y-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-(--cl-text)">Privacy policy</h1>
        <p className="text-sm text-(--cl-muted)">Last updated {LAST_UPDATED}</p>
      </div>

      <p className="text-sm leading-relaxed text-(--cl-text)">
        CV Forge stores the contents of your CV, which is personal data by definition. This page
        says plainly what is kept, who else can reach it, how long it stays, and how to get rid of
        it. It describes what the service actually does today, not what it might do.
      </p>

      <Section title="Who is responsible">
        <p>
          CV Forge is run by <strong className="font-medium">Martin Persson</strong> as a private
          individual, and is the data controller for everything described here.
        </p>
        <p>
          For any question about your data, including the requests described under{" "}
          <em>Your rights</em> below, write to{" "}
          <a
            href="mailto:support@appfinningar.se"
            className="text-(--cl-accent) underline underline-offset-2"
          >
            support@appfinningar.se
          </a>
          .
        </p>
      </Section>

      <Section title="What is stored">
        <ul className="list-disc pl-5 space-y-2 marker:text-(--cl-muted)">
          <li>
            <strong className="font-medium">Your account</strong> — email address and name. If you
            sign in with Google, the identifier Google returns for your account is stored so you can
            sign in again. If you use a password, only a hash of it is kept, never the password
            itself.
          </li>
          <li>
            <strong className="font-medium">Your CV content</strong> — everything you enter:
            profiles, work history, education, skills, projects, cover letters. This is free text
            that you choose and control. Whatever you type into a CV is stored as you typed it.
          </li>
          <li>
            <strong className="font-medium">Profile photos</strong> — any images you upload for use
            on a CV.
          </li>
          <li>
            <strong className="font-medium">A session cookie</strong> — see <em>Cookies</em> below.
          </li>
        </ul>
        <p>
          There is no analytics, no tracking, no advertising, and no profiling. Nothing about you is
          sold or shared for marketing, by anyone, ever.
        </p>
      </Section>

      <Section title="Why, and on what legal basis">
        <p>
          Your account and CV content are processed to provide the service you signed up for —
          Article 6(1)(b) of the GDPR, performance of a contract. Without this data there is no CV to
          build.
        </p>
        <p>
          Verifying your email address on sign-up rests on legitimate interest, Article 6(1)(f): it
          keeps accounts from being created against other people&rsquo;s addresses.
        </p>
      </Section>

      <Section title="Who else can see it">
        <p>
          The service runs on a server owned and operated by the controller, physically located in
          Sweden. The following third parties process data on its behalf, each limited to one job:
        </p>
        <ul className="list-disc pl-5 space-y-2 marker:text-(--cl-muted)">
          <li>
            <strong className="font-medium">Cloudflare</strong> — stores uploaded photos, and carries
            web traffic to the server. The storage bucket is configured with an EU jurisdiction
            restriction, so uploaded images are stored within the European Union.
          </li>
          <li>
            <strong className="font-medium">Google</strong> — two separate, optional cases. If you
            choose &ldquo;Continue with Google&rdquo;, Google handles that sign-in. If you use the
            PDF import feature, the contents of the CV you upload are sent to Google&rsquo;s Gemini
            API to be read and turned into structured entries. That request runs on the paid API
            tier, under terms where the content is not used to train Google&rsquo;s models. If you
            never use PDF import, no CV content is sent to Google.
          </li>
          <li>
            <strong className="font-medium">Resend</strong> — sends account emails: address
            verification and password resets. It receives your email address and the contents of
            those messages, nothing else.
          </li>
        </ul>
        <p>
          Cloudflare, Google and Resend are US companies, so some processing may take place outside
          the EU/EEA. Each is engaged under a data processing agreement with the standard
          contractual clauses approved by the European Commission.
        </p>
        <p>
          Backups are encrypted before they leave the server, using a key the server itself does not
          hold. Cloudflare therefore stores backup files it cannot read.
        </p>
      </Section>

      <Section title="The operator can see your data">
        <p>
          Worth stating rather than leaving implied: as the person running the server and the
          database, the controller is technically able to read what you store, in the same way that
          anyone hosting a service can. That access is used for operating and fixing the service, not
          for reading CVs. No one else has an account on the server.
        </p>
      </Section>

      <Section title="How long it is kept">
        <ul className="list-disc pl-5 space-y-2 marker:text-(--cl-muted)">
          <li>
            <strong className="font-medium">Your account and its content</strong> — until you delete
            it. There is no inactivity expiry; nothing is removed behind your back.
          </li>
          <li>
            <strong className="font-medium">Expired sign-in sessions and password-reset links</strong>{" "}
            — cleared out nightly once they have expired.
          </li>
          <li>
            <strong className="font-medium">Encrypted backups</strong> — deleted automatically 30
            days after they are made. A deleted account can therefore still exist inside a backup for
            up to 30 days before those copies expire in turn.
          </li>
        </ul>
      </Section>

      <Section title="Deleting your account">
        <p>
          You can delete your account yourself, at any time, from{" "}
          <LocaleLink href="/settings" className="text-(--cl-accent) underline underline-offset-2">
            Settings
          </LocaleLink>
          . There is no need to ask, and no waiting period.
        </p>
        <p>Deleting removes, immediately and permanently:</p>
        <ul className="list-disc pl-5 space-y-2 marker:text-(--cl-muted)">
          <li>your account, sign-in details and active sessions</li>
          <li>every CV, profile, and all experience, education, skills, projects and other entries</li>
          <li>every photo you uploaded, deleted from storage and not merely unlinked</li>
          <li>any outstanding password-reset links tied to your account</li>
        </ul>
        <p>
          The one exception is the backups described above, which expire on their own within 30 days
          and cannot be edited in the meantime — they are encrypted archives, not a live copy.
        </p>
      </Section>

      <Section title="Your rights">
        <p>Under the GDPR you may ask to:</p>
        <ul className="list-disc pl-5 space-y-2 marker:text-(--cl-muted)">
          <li>get a copy of the data held about you</li>
          <li>correct anything inaccurate — most of it you can edit directly in the app</li>
          <li>have your data erased — the Settings page does this immediately</li>
          <li>receive your data in a portable, machine-readable format</li>
          <li>object to or restrict processing</li>
        </ul>
        <p>
          Email <a
            href="mailto:support@appfinningar.se"
            className="text-(--cl-accent) underline underline-offset-2"
          >
            support@appfinningar.se
          </a>{" "}
          for any of these. There is no self-service export yet, so a copy of your data is produced
          by hand on request — you will get it within 30 days, normally sooner.
        </p>
        <p>
          If you think your data is being handled wrongly, you can complain to the Swedish Authority
          for Privacy Protection (IMY), which supervises this service.
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          One cookie, <code className="text-sm bg-(--cl-bg) px-1 py-0.5 rounded">better-auth.session_token</code>,
          which keeps you signed in. It is strictly necessary for the service to work and is removed
          when you sign out.
        </p>
        <p>
          There are no analytics cookies, no third-party cookies, and no tracking of any kind — which
          is why this site does not ask you to accept anything.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          If what the service does changes, this page changes with it and the date at the top is
          updated. For anything that materially affects how your data is handled, you will be told by
          email rather than left to notice a new date.
        </p>
      </Section>
    </main>
  );
}
