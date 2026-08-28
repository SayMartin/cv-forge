"use client";

import { useState } from "react";
import { LocaleLink } from "@/components/LocaleLink";
import { authClient } from "@/lib/auth-client";
import { PasswordField } from "@/app/[lang]/(auth)/PasswordField";
import { GoogleSignInButton } from "@/app/[lang]/(auth)/GoogleSignInButton";
import { authErrorMessage } from "@/i18n/authErrors";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { RichText } from "@/i18n/format";
import { localeHref } from "@/i18n/routing";
import { useLocale } from "@/i18n/useLocale";

export default function SignUpPage() {
  const locale = useLocale();
  const { auth } = useDictionary();
  const t = auth.signUp;
  // The verification link lands here from an email, so the locale has to be
  // baked into the URL — there is no cookie or referrer to fall back on when the
  // link is opened in a different browser from the one that signed up.
  const verifiedCallback = localeHref(locale, "/sign-in?verified=true");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirm) {
      setError(auth.passwordMismatch);
      return;
    }
    setPending(true);
    setError(null);

    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: verifiedCallback,
      // Passed in the same call that creates the row, rather than written
      // afterwards: the verification email is sent from inside account
      // creation, so a follow-up update would land too late to affect the one
      // message that matters most. Typed only because `inferAdditionalFields`
      // is on the auth client — without it this is a compile error.
      locale,
    });

    if (error) {
      setError(authErrorMessage(auth.errors, error));
      setPending(false);
      return;
    }

    const { error: verificationError } = await authClient.sendVerificationEmail({
      email,
      callbackURL: verifiedCallback,
    });

    if (verificationError) {
      // Not routed through `authErrorMessage`: the account *was* created, and no
      // error code carries that. The distinction is the whole point of the
      // message — "try again" here must not read as "sign up again".
      setError(t.verificationSendFailed);
      setPending(false);
      return;
    }

    setEmailSent(true);
  }

  if (emailSent) {
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
            {t.sent.backToSignIn}
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
        <h1 className="text-2xl font-bold tracking-tight text-(--cl-text)">
          {t.title}
        </h1>

        <GoogleSignInButton />

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-(--cl-border)" />
          <span className="text-sm text-(--cl-muted)">{auth.or}</span>
          <div className="flex-1 h-px bg-(--cl-border)" />
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        )}

        <div className="space-y-1">
          <label className="block text-sm font-medium text-(--cl-text)">
            {t.name}
          </label>
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) focus:outline-none focus:ring-2 focus:ring-(--cl-accent)"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-(--cl-text)">
            {t.email}
          </label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) focus:outline-none focus:ring-2 focus:ring-(--cl-accent)"
          />
        </div>

        <PasswordField
          label={t.password}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />

        <PasswordField
          label={t.confirmPassword}
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />

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
          {t.haveAccount}{" "}
          <LocaleLink
            href="/sign-in"
            className="text-(--cl-accent) font-medium hover:underline"
          >
            {t.signIn}
          </LocaleLink>
        </p>

        {/* The link used to be assembled around a fixed trailing full stop. The
            translation now owns the whole sentence, punctuation included — in
            Swedish the link text is the last word before the stop as well, but
            nothing about `RichText` requires that to stay true. */}
        <p className="text-sm text-center text-(--cl-muted)">
          <RichText
            template={t.privacyNotice}
            values={{
              privacyPolicy: (
                <LocaleLink
                  href="/privacy"
                  className="underline underline-offset-2 hover:text-(--cl-text)"
                >
                  {t.privacyPolicy}
                </LocaleLink>
              ),
            }}
          />
        </p>
      </form>
    </main>
  );
}
