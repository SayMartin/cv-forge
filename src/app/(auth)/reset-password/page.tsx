"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { PasswordField } from "@/app/(auth)/PasswordField";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!token) {
    return (
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-sm border border-(--cl-border) space-y-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-(--cl-text)">Invalid link</h1>
        <p className="text-sm text-(--cl-muted)">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <a href="/forgot-password" className="text-sm text-(--cl-accent) font-medium hover:underline">
          Request a new link
        </a>
      </div>
    );
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    setError(null);

    const { error } = await authClient.resetPassword({ newPassword: password, token: token! });

    if (error) {
      setError(error.message ?? "Failed to reset password. The link may have expired.");
      setPending(false);
    } else {
      router.push("/sign-in?reset=true");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm bg-white p-8 rounded-xl shadow-sm border border-(--cl-border) space-y-5"
    >
      <h1 className="text-2xl font-bold tracking-tight text-(--cl-text)">Choose a new password</h1>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
      )}

      <PasswordField
        label="New password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
      />

      <PasswordField
        label="Confirm new password"
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
        {pending ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-(--cl-bg)">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
