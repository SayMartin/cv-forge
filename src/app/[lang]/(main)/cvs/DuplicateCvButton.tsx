"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionChip } from "@/components/ActionChip";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { format } from "@/i18n/format";
import { localeHref } from "@/i18n/routing";
import { useLocale } from "@/i18n/useLocale";

// `cvName` is here only so the copy can be named in the reader's language: the
// route cannot compose "Kopia av …" itself, because a Route Handler has no
// access to `next/root-params` and so no idea which locale asked.
export function DuplicateCvButton({ cvId, cvName }: { cvId: string; cvName: string }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useDictionary().cvs.duplicate;
  const [loading, setLoading] = useState(false);

  async function handleDuplicate(e: React.MouseEvent) {
    e.preventDefault(); // prevent the parent <Link> from firing
    setLoading(true);
    const res = await fetch(`/api/cvs/${cvId}/duplicate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: format(t.copyOf, { name: cvName }) }),
    });
    if (res.ok) {
      const copy = await res.json();
      router.push(localeHref(locale, `/cvs/${copy.id}`));
    }
    setLoading(false);
  }

  return (
    <ActionChip
      onClick={handleDuplicate}
      disabled={loading}
      title={t.tooltip}
    >
      {/* The ellipsis is the pending state in every language — no key for it. */}
      {loading ? "…" : t.label}
    </ActionChip>
  );
}
