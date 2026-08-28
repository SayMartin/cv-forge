"use client";

import { useState, useRef } from "react";
import { LocaleLink } from "@/components/LocaleLink";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { plural, RichText } from "@/i18n/format";
import { useLocale } from "@/i18n/useLocale";
import { useApiError } from "@/i18n/useApiError";

type ImportResult = {
  ok: boolean;
  summary?: {
    experience: number;
    education: number;
    skills: number;
    projects: number;
    other: number;
  };
  /** Already translated by the time it lands here — see `handleSubmit`. */
  error?: string;
};

// The order the summary is listed in. Explicit rather than `Object.keys`,
// because the order is editorial — profile, then the four things the importer
// exists to find, then the leftovers.
const COUNTERS = [
  "experience",
  "education",
  "skills",
  "projects",
  "other",
] as const;

export default function ImportPage() {
  const locale = useLocale();
  const { importPage, nav } = useDictionary();
  const apiError = useApiError();
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setResult(null);

    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/cv-import", { method: "POST", body });
      const data: unknown = await res.json();

      // A failure body is `{ code, error, params }`, not an ImportResult — so it
      // is translated here and only the sentence is kept.
      if (!res.ok || !(data as ImportResult)?.ok) {
        setStatus("error");
        setResult({ ok: false, error: apiError(data) });
        return;
      }

      setStatus("success");
      setResult(data as ImportResult);
    } catch {
      setStatus("error");
      setResult({ ok: false, error: importPage.networkError });
    }
  }

  // Pulled out of the JSX so the narrowing survives into the `map` callback
  // below — TypeScript keeps it across a closure for a `const`, but not for a
  // `result?.summary` guard written inline.
  const summary = status === "success" ? result?.summary : undefined;

  return (
    <main className="py-16 px-4">
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-(--cl-text)">
            {importPage.title}
          </h1>
          {/* Capped below the container: this is the page's only explanation, and
              at the full 3xl it would run past 100 characters a line. */}
          <p className="mt-1 text-sm text-(--cl-muted) max-w-xl">
            {importPage.intro}
          </p>
          <p className="mt-2 text-sm text-(--cl-muted) max-w-xl">
            {importPage.limits}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex items-center gap-3 rounded-lg border border-(--cl-border) bg-white px-4 py-3 cursor-pointer hover:border-(--cl-accent) transition-colors">
            <svg
              className="w-5 h-5 text-(--cl-muted) shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-sm text-(--cl-muted) truncate">
              {fileName ?? importPage.selectFile}
            </span>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              required
            />
          </label>

          <button
            type="submit"
            disabled={status === "uploading" || !fileName}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-(--cl-accent) px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40 hover:bg-(--cl-accent-hov) transition-colors"
          >
            {status === "uploading" && (
              <svg
                className="w-4 h-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12" cy="12" r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            )}
            {status === "uploading" ? importPage.submitting : importPage.submit}
          </button>
        </form>

        {summary && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4 text-sm space-y-1">
            <p className="font-medium text-green-800">{importPage.success.title}</p>
            <ul className="text-green-700 list-disc list-inside">
              <li>{importPage.success.profile}</li>
              {/* Was `{n} experience entries` written inline, which reads
                  "1 experience entries" at n=1 in English and is worse in
                  Swedish, where the noun changes shape. `plural` picks the form
                  and fills `{count}` — see `PluralForms` for why a ternary here
                  would have been the wrong fix. */}
              {COUNTERS.map((key) => {
                const count = summary[key];
                // "other" is the only one hidden at zero: the four above are the
                // point of the import and "0 projects" is real information,
                // while "0 other entries" is noise.
                if (key === "other" && count === 0) return null;
                return (
                  <li key={key}>
                    {plural(locale, importPage.success.counts[key], count)}
                  </li>
                );
              })}
            </ul>
            <p className="text-green-600 pt-1">
              <RichText
                template={importPage.success.review}
                values={{
                  myContent: (
                    <LocaleLink href="/content" className="underline font-medium">
                      {/* The navbar's own label, so the sentence names the
                          destination exactly as the tab the reader will look for. */}
                      {nav.myContent}
                    </LocaleLink>
                  ),
                }}
              />
            </p>
          </div>
        )}

        {status === "error" && result?.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="font-medium">{importPage.failure.title}</p>
            <p>{result.error}</p>
          </div>
        )}
      </div>
    </main>
  );
}
