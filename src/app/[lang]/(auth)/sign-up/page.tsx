"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { PasswordField } from "@/app/(auth)/PasswordField";
import { GoogleSignInButton } from "@/app/(auth)/GoogleSignInButton";

export default function SignUpPage() {
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
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    setError(null);

    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: "/sign-in?verified=true",
    });

    if (error) {
      setError(error.message ?? "Sign up failed");
      setPending(false);
      return;
    }

    const { error: verificationError } = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/sign-in?verified=true",
    });

    if (verificationError) {
      setError(
        "Your account was created, but we couldn't send the verification email. Please try again from the sign in page."
      );
      setPending(false);
      return;
    }

    setEmailSent(true);
  }

  if (emailSent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-(--cl-bg)">
        <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-sm border border-(--cl-border) space-y-4 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-(--cl-text)">Check your email</h1>
          <p className="text-sm text-(--cl-muted)">
            We sent a verification link to <span className="font-medium text-(--cl-text)">{email}</span>.
            Click the link to activate your account.
          </p>
          <Link href="/sign-in" className="text-sm text-(--cl-accent) font-medium hover:underline">
            Back to sign in
          </Link>
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
          Create account
        </h1>

        <GoogleSignInButton />

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-(--cl-border)" />
          <span className="text-sm text-(--cl-muted)">or</span>
          <div className="flex-1 h-px bg-(--cl-border)" />
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        )}

        <div className="space-y-1">
          <label className="block text-sm font-medium text-(--cl-text)">
            Full name
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

        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />

        <PasswordField
          label="Confirm password"
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
          {pending ? "Creating account…" : "Create account"}
        </button>

        <p className="text-sm text-center text-(--cl-muted)">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-(--cl-accent) font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>

        {/* Article 13 wants the information given at the point data is collected,
            which is this form — not only somewhere in the footer. */}
        <p className="text-sm text-center text-(--cl-muted)">
          By creating an account you agree to how your data is handled, described in the{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-(--cl-text)">
            privacy policy
          </Link>
          .
        </p>
      </form>
    </main>
  );
}
