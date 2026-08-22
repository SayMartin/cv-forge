import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const STEPS = [
  {
    n: "01",
    title: "Import your existing CV",
    body: "Already have a PDF CV? Upload it and we'll extract your work history, education, and skills automatically — no manual re-entry needed.",
    tag: "optional shortcut",
  },
  {
    n: "02",
    title: "Build your content library",
    body: "Add or review your personal details, work experience, education, and skills. Everything is stored once as reusable building blocks.",
    tag: null,
  },
  {
    n: "03",
    title: "Build a CV",
    body: "Create a new CV, choose a layout, and pick exactly which content to include. Customise colours and style to match your brand.",
    tag: null,
  },
  {
    n: "04",
    title: "Export to PDF",
    body: "Download a pixel-perfect, print-ready PDF in seconds. Share it directly or send it off to your next opportunity.",
    tag: null,
  },
];

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="bg-(--cl-nav) text-(--cl-nav-text) py-14 px-6">
        {/* 4xl to match the app pages. Harmless here: the h1 breaks manually and
            the paragraph keeps its own `max-w-lg`, so nothing gets a longer line
            — the section just stops being narrower than everything after it. */}
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            Craft your story,
            <br />
            land the role.
          </h1>
          <p
            className="text-lg leading-relaxed max-w-lg mx-auto"
            style={{ color: "#8FA87A" }}
          >
            CV Forge lets you manage your career content in one place and
            export beautifully formatted CVs in seconds.
          </p>
          {session ? (
            <Link
              href="/cvs"
              className="inline-block bg-(--cl-accent) text-white rounded-lg px-7 py-3 text-sm font-semibold hover:bg-(--cl-accent-hov) transition-colors"
            >
              My CVs →
            </Link>
          ) : (
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/sign-up"
                className="inline-block bg-(--cl-accent) text-white rounded-lg px-7 py-3 text-sm font-semibold hover:bg-(--cl-accent-hov) transition-colors"
              >
                Get started — it&apos;s free →
              </Link>
              <Link
                href="/sign-in"
                className="text-sm hover:text-white transition-colors"
                style={{ color: "#8FA87A" }}
              >
                Already have an account? Sign in
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-(--cl-bg)">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-(--cl-muted) text-center mb-14">
            How it works
          </h2>
          {/* Two columns rather than a taller single one. Stretching these four
              paragraphs across the wider section would push them past a
              comfortable line length; splitting them keeps each body around the
              measure it had at max-w-2xl and spends the width on the layout. */}
          <ol className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {STEPS.map((step) => (
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
                      <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-(--cl-pill) text-(--cl-muted)">
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
            <h2 className="text-base font-semibold text-(--cl-text)">Your data, your control</h2>
            <p className="text-sm text-(--cl-muted) leading-relaxed">
              Sign up with email and password or your Google account — no credit card, no obligations.
              All your content belongs to you. If you ever want to leave, delete your account from{" "}
              <strong className="text-(--cl-text) font-medium">Settings</strong> and every piece of data
              associated with your account — CVs, profiles, experience, education, skills, and all other
              entries — is permanently and immediately erased.
            </p>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────── */}
      {!session && (
        <section className="py-16 px-6 bg-(--cl-surface) border-t border-(--cl-border)">
          <div className="max-w-md mx-auto text-center space-y-5">
            <h2 className="text-2xl font-bold text-(--cl-text) tracking-tight">
              Ready to get started?
            </h2>
            <p className="text-sm text-(--cl-muted)">
              Create your account in seconds. No credit card required.
            </p>
            <Link
              href="/sign-up"
              className="inline-block bg-(--cl-accent) text-white rounded-lg px-7 py-3 text-sm font-semibold hover:bg-(--cl-accent-hov) transition-colors"
            >
              Create a free account
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
