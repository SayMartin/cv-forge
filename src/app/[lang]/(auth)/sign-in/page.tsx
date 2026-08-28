"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LocaleLink } from "@/components/LocaleLink";
import { authClient } from "@/lib/auth-client";
import { PasswordField } from "@/app/[lang]/(auth)/PasswordField";
import { GoogleSignInButton } from "@/app/[lang]/(auth)/GoogleSignInButton";
import { authErrorMessage } from "@/i18n/authErrors";
import { useDictionary } from "@/i18n/DictionaryProvider";

function SignInForm() {
  const { auth } = useDictionary();
  const t = auth.signIn;
  const searchParams = useSearchParams();
  // Carried un-prefixed in the query — the prefix is added on the way out, by
  // `/api/locale/resume`, so a `?callbackUrl=/cvs` written by a server redirect
  // stays readable. `localeHref` there is idempotent, so an already-prefixed
  // value passes through unharmed.
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const verified = searchParams.get("verified") === "true";
  const reset = searchParams.get("reset") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const { error } = await authClient.signIn.email({ email, password });

    if (error) {
      // Was `error === "Email not verified"` — a comparison against an English
      // sentence that lives inside `@better-auth/core`. It broke the moment the
      // page could be Swedish, and it would have broken silently the day the
      // library reworded the string. The code is the stable identifier.
      setError(authErrorMessage(auth.errors, error));
      setPending(false);
    } else {
      // Not `router.push`: the account's language has to be read and written to
      // the cookie *before* the next page renders, and only a real navigation
      // through the route handler can do that. A client-side push would render
      // the destination in whatever language this device happened to be in.
      //
      // The lint rule below is about navigating to internal *pages* with the
      // router instead; this destination is a Route Handler, which the router
      // cannot navigate to at all.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/api/locale/resume?next=${encodeURIComponent(callbackUrl)}`);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm bg-white p-8 rounded-xl shadow-sm border border-(--cl-border) space-y-5"
    >
      <h1 className="text-2xl font-bold tracking-tight text-(--cl-text)">
        {t.title}
      </h1>

      {verified && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
          {t.verified}
        </p>
      )}

      {reset && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
          {t.reset}
        </p>
      )}

      <GoogleSignInButton callbackURL={callbackUrl} />

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-(--cl-border)" />
        <span className="text-sm text-(--cl-muted)">{auth.or}</span>
        <div className="flex-1 h-px bg-(--cl-border)" />
      </div>

      {/* The "not verified" case used to repeat the address back inside the
          message. It is in the focused field two lines below, so the sentence
          says the same thing without a placeholder to keep in sync. */}
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

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

      <div className="space-y-1">
        <PasswordField
          label={t.password}
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
        <div className="text-right">
          <LocaleLink href="/forgot-password" className="text-sm text-(--cl-muted) hover:text-(--cl-accent)">
            {t.forgotPassword}
          </LocaleLink>
        </div>
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
        {t.noAccount}{" "}
        <LocaleLink
          href="/sign-up"
          className="text-(--cl-accent) font-medium hover:underline"
        >
          {t.createOne}
        </LocaleLink>
      </p>
    </form>
  );
}

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-(--cl-bg)">
      <Suspense>
        <SignInForm />
      </Suspense>
    </main>
  );
}
