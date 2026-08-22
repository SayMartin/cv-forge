"use client";

import { useState, useRef } from "react";
import Link from "next/link";

type ImportResult = {
  ok: boolean;
  summary?: {
    experience: number;
    education: number;
    skills: number;
    projects: number;
    other: number;
  };
  error?: string;
};

export default function ImportPage() {
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
      const data: ImportResult = await res.json();
      setStatus(!res.ok || !data.ok ? "error" : "success");
      setResult(data);
    } catch {
      setStatus("error");
      setResult({ ok: false, error: "Network error — please try again." });
    }
  }

  return (
    <main className="py-16 px-4">
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-(--cl-text)">
            Import CV from PDF
          </h1>
          {/* Capped below the container: this is the page's only explanation, and
              at the full 3xl it would run past 100 characters a line. */}
          <p className="mt-1 text-sm text-(--cl-muted) max-w-xl">
            Upload a PDF CV and the content will be extracted by AI and added
            to your content library. A new profile will be created from your
            personal details. All other entries — experience, education, skills,
            projects, and certifications — are added as new items ready to use
            in your CVs.
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
              {fileName ?? "Click to select a PDF…"}
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
            {status === "uploading" ? "Importing…" : "Import CV"}
          </button>
        </form>

        {status === "success" && result?.summary && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4 text-sm space-y-1">
            <p className="font-medium text-green-800">Import successful ✓</p>
            <ul className="text-green-700 list-disc list-inside">
              <li>Profile created</li>
              <li>{result.summary.experience} experience entries</li>
              <li>{result.summary.education} education entries</li>
              <li>{result.summary.skills} skills</li>
              <li>{result.summary.projects} projects</li>
              {result.summary.other > 0 && (
                <li>{result.summary.other} other entries</li>
              )}
            </ul>
            <p className="text-green-600 pt-1">
              Review and edit in{" "}
              <Link href="/content" className="underline font-medium">My Content</Link>.
            </p>
          </div>
        )}

        {status === "error" && result?.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="font-medium">Import failed</p>
            <p>{result.error}</p>
          </div>
        )}
      </div>
    </main>
  );
}
