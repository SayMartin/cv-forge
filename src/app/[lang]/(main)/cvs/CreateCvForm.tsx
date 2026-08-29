"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { useApiError } from "@/i18n/useApiError";
import { localeHref } from "@/i18n/routing";
import { useLocale } from "@/i18n/useLocale";

export function CreateCvForm() {
  const router = useRouter();
  const locale = useLocale();
  const t = useDictionary().cvs.create;
  const apiError = useApiError();
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const res = await fetch("/api/cvs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // A new CV starts in the language of the page it was created from — the
      // most likely intent, and changeable in the editor. It is only a default:
      // `Cv.language` and the UI locale are separate settings from here on.
      body: JSON.stringify({ name, language: locale }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(apiError(data, t.failed));
      setPending(false);
      return;
    }

    const cv = await res.json();
    router.push(localeHref(locale, `/cvs/${cv.id}`));
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-start">
      <input
        type="text"
        placeholder={t.placeholder}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="flex-1 border border-(--cl-border) rounded-lg px-3 py-2 text-sm bg-white text-(--cl-text) placeholder:text-(--cl-muted) focus:outline-none focus:ring-2 focus:ring-(--cl-accent)"
      />
      <button
        type="submit"
        disabled={pending}
        className="bg-(--cl-accent) text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 hover:bg-(--cl-accent-hov) transition-colors whitespace-nowrap flex items-center gap-2"
      >
        {pending && (
          <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {pending ? t.submitting : t.submit}
      </button>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </form>
  );
}
