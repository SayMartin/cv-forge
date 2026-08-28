"use client";

import { useRef, useState } from "react";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { useApiError } from "@/i18n/useApiError";
import { format } from "@/i18n/format";

const MAX_IMAGES = 5;

export function AvatarsTab({ initialImages }: { initialImages: string[] }) {
  const { form: t, avatars: d } = useDictionary().content;
  const apiError = useApiError();
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const body = new FormData();
    body.append("file", file);

    const res = await fetch("/api/avatars", { method: "POST", body });
    const data = await res.json();

    if (!res.ok) {
      setError(apiError(data, d.uploadFailed));
    } else {
      setImages(data.images);
    }

    setUploading(false);
    // Reset input so the same file can be re-selected if needed
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRemove(url: string) {
    const res = await fetch("/api/avatars", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remove: url }),
    });
    const data = await res.json();
    if (res.ok) {
      setImages(data.images);
    } else {
      setError(apiError(data, t.deleteFailed));
    }
  }

  const atLimit = images.length >= MAX_IMAGES;

  return (
    <div className="space-y-4">
      <p className="text-sm text-(--cl-muted)">{format(d.intro, { max: MAX_IMAGES })}</p>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        {images.map((url) => (
          <div key={url} className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={d.alt}
              className="w-20 h-20 rounded-full object-cover border border-(--cl-border)"
            />
            <button
              type="button"
              onClick={() => handleRemove(url)}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border border-(--cl-border) text-(--cl-muted) hover:text-red-500 hover:border-red-400 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 text-sm leading-none"
              aria-label={d.remove}
            >
              ×
            </button>
          </div>
        ))}

        {!atLimit && (
          <label className={`flex flex-col items-center justify-center w-20 h-20 rounded-full border-2 border-dashed border-(--cl-border) cursor-pointer hover:border-(--cl-accent) transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
            {uploading ? (
              <svg className="w-5 h-5 text-(--cl-muted) animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <>
                <svg className="w-5 h-5 text-(--cl-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm text-(--cl-muted) mt-1">{d.add}</span>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {atLimit && (
        <p className="text-sm text-(--cl-muted)">{format(d.atLimit, { max: MAX_IMAGES })}</p>
      )}
    </div>
  );
}
