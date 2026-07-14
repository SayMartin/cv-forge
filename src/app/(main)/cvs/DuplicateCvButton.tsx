"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DuplicateCvButton({ cvId }: { cvId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDuplicate(e: React.MouseEvent) {
    e.preventDefault(); // prevent the parent <Link> from firing
    setLoading(true);
    const res = await fetch(`/api/cvs/${cvId}/duplicate`, { method: "POST" });
    if (res.ok) {
      const copy = await res.json();
      router.push(`/cvs/${copy.id}`);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleDuplicate}
      disabled={loading}
      title="Duplicate CV"
      className="shrink-0 text-xs text-(--cl-muted) hover:text-(--cl-accent) transition-colors disabled:opacity-40 px-1"
    >
      {loading ? "…" : "Duplicate"}
    </button>
  );
}
