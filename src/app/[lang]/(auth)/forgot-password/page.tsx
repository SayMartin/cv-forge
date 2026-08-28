"use client";

import { useState } from "react";
import { LocaleLink } from "@/components/LocaleLink";
import { authClient } from "@/lib/auth-client";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { RichText } from "@/i18n/format";
import { localeHref } from "@/i18n/routing";
import { useLocale } from "@/i18n/useLocale";

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const t = useDictionary().auth.forgotPassword;
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    await authClient.requestPasswordReset({
      email,
      // Prefixed, for the same reason sign-up prefixes its verification
      // callback: this becomes the link inside an email, and an email is opened
      // wherever the reader keeps their mail — often a different browser, with
      // no locale cookie and no referrer. `proxy.ts` would then negotiate from
      // `Accept-Language` and could land a Swedish-preferring account on the
      // English page. Baking the locale into the URL is the only thing that
      // survives the trip.
      redirectTo: localeHref(locale, "/reset-password"),
    });
    // Always show success — don't reveal whether the email exists.
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-(--cl-bg)">
        <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-sm border border-(--cl-border) space-y-4 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-(--cl-text)">{t.sent.title}</h1>
          <p className="text-sm text-(--cl-muted)">
            <RichText
              template={t.sent.body}
              values={{
                email: <span className="font-medium text-(--cl-text)">{email}</span>,
              }}
            />
          </p>
          <LocaleLink href="/sign-in" className="text-sm text-(--cl-accent) font-medium hover:underline">
            {t.backToSignIn}
          </LocaleLink>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-(--cl-bg)">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-8 rounded-xl shadow-sm border border-(--cl-border) space-y-5"
      >
        <h1 className="text-2xl font-bold tracking-tight text-(--cl-text)">{t.title}</h1>
        <p className="text-sm text-(--cl-muted)">{t.intro}</p>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-(--cl-text)">{t.email}</label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) focus:outline-none focus:ring-2 focus:ring-(--cl-accent)"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-(--cl-accent) text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 hover:bg-(--cl-accent-hov) transition-colors flex items-center justify-center gap-2"
        >
          {pending && (
            <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {pending ? t.submitting : t.submit}
        </button>

        <p className="text-sm text-center text-(--cl-muted)">
          <LocaleLink href="/sign-in" className="text-(--cl-accent) font-medium hover:underline">
            {t.backToSignIn}
          </LocaleLink>
        </p>
      </form>
    </main>
  );
}
