"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { RichText } from "@/i18n/format";

export function DeleteAccountSection({ email }: { email: string }) {
  const t = useDictionary().settings.delete;
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setOpen(false);
    setTyped("");
    setError(null);
  }

  async function handleDelete() {
    if (typed !== email) return;
    setPending(true);
    setError(null);

    const res = await fetch("/api/user", { method: "DELETE" });

    if (!res.ok) {
      // As in `CreateCvForm`: `body.error` stays English until step 5 gives the
      // route an error code. The fallback is translatable today.
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? t.failed);
      setPending(false);
      return;
    }

    await authClient.signOut();
    window.location.href = "/";
  }

  return (
    <div className="bg-white rounded-xl border border-red-200 p-5 space-y-4">
      <div>
        <p className="text-sm font-medium text-(--cl-text)">{t.title}</p>
        <p className="text-sm text-(--cl-muted) mt-1 leading-relaxed">
          {t.description}
        </p>
      </div>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-red-600 border border-red-300 rounded-lg px-4 py-2 hover:bg-red-50 transition-colors"
        >
          {t.open}
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-(--cl-muted)">
            <RichText
              template={t.confirm}
              values={{
                email: (
                  <span className="font-mono font-semibold text-(--cl-text)">
                    {email}
                  </span>
                ),
              }}
            />
          </p>
          <input
            type="email"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={email}
            autoComplete="off"
            className="w-full border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              disabled={typed !== email || pending}
              className="text-sm bg-red-600 text-white rounded-lg px-4 py-2 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {pending && (
                <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {pending ? t.submitting : t.submit}
            </button>
            <button
              type="button"
              onClick={reset}
              className="text-sm text-(--cl-muted) hover:text-(--cl-text) transition-colors"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
