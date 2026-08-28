"use client";

import { useState } from "react";
import { LocaleLink } from "@/components/LocaleLink";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });
    // Always show success — don't reveal whether the email exists.
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-(--cl-bg)">
        <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-sm border border-(--cl-border) space-y-4 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-(--cl-text)">Check your email</h1>
          <p className="text-sm text-(--cl-muted)">
            If <span className="font-medium text-(--cl-text)">{email}</span> is registered, you will receive a reset link shortly.
          </p>
          <LocaleLink href="/sign-in" className="text-sm text-(--cl-accent) font-medium hover:underline">
            Back to sign in
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
        <h1 className="text-2xl font-bold tracking-tight text-(--cl-text)">Forgot password</h1>
        <p className="text-sm text-(--cl-muted)">
          Enter your email address and we will send you a link to reset your password.
        </p>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-(--cl-text)">Email</label>
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
          {pending ? "Sending…" : "Send reset link"}
        </button>

        <p className="text-sm text-center text-(--cl-muted)">
          <LocaleLink href="/sign-in" className="text-(--cl-accent) font-medium hover:underline">
            Back to sign in
          </LocaleLink>
        </p>
      </form>
    </main>
  );
}
