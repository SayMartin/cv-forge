"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LocaleLink } from "@/components/LocaleLink";
import { authClient } from "@/lib/auth-client";
import { PasswordField } from "@/app/[lang]/(auth)/PasswordField";
import { GoogleSignInButton } from "@/app/[lang]/(auth)/GoogleSignInButton";
import { localeHref } from "@/i18n/routing";
import { useLocale } from "@/i18n/useLocale";

function SignInForm() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  // Carried un-prefixed in the query — the locale is added on the way out, so a
  // `?callbackUrl=/cvs` written by a server redirect stays readable. `localeHref`
  // is idempotent, so an already-prefixed value passes through unharmed.
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
      setError(error.message ?? "Sign in failed");
      setPending(false);
    } else {
      router.push(localeHref(locale, callbackUrl));
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm bg-white p-8 rounded-xl shadow-sm border border-(--cl-border) space-y-5"
    >
      <h1 className="text-2xl font-bold tracking-tight text-(--cl-text)">
        Sign in
      </h1>

      {verified && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
          Email verified — you can now sign in.
        </p>
      )}

      {reset && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
          Password updated — you can now sign in with your new password.
        </p>
      )}

      <GoogleSignInButton callbackURL={callbackUrl} />

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-(--cl-border)" />
        <span className="text-sm text-(--cl-muted)">or</span>
        <div className="flex-1 h-px bg-(--cl-border)" />
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error === "Email not verified"
            ? <>Email not verified. Please check your inbox for <span className="font-medium">{email}</span> and click the verification link.</>
            : error}
        </p>
      )}

      <div className="space-y-1">
        <label className="block text-sm font-medium text-(--cl-text)">
          Email
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
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
        <div className="text-right">
          <LocaleLink href="/forgot-password" className="text-sm text-(--cl-muted) hover:text-(--cl-accent)">
            Forgot password?
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
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-sm text-center text-(--cl-muted)">
        No account yet?{" "}
        <LocaleLink
          href="/sign-up"
          className="text-(--cl-accent) font-medium hover:underline"
        >
          Create one
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
