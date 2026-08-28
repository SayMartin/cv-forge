"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionChip } from "@/components/ActionChip";

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
    <ActionChip
      onClick={handleDuplicate}
      disabled={loading}
      title="Duplicate CV"
    >
      {loading ? "…" : "Duplicate"}
    </ActionChip>
  );
}
