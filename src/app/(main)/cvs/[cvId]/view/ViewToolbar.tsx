"use client";

import Link from "next/link";
import { ExportButton } from "./ExportButton";

type Props = {
  cvId: string;
  cvName: string;
  layoutName: string;
};

export function ViewToolbar({ cvId, cvName, layoutName }: Props) {
  return (
    <div className="bg-white border-b border-(--cl-border) print:hidden">
      <div className="px-4 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* Left: back link */}
        <Link
          href={`/cvs/${cvId}`}
          className="text-sm text-(--cl-muted) hover:text-(--cl-text) transition-colors justify-self-start"
        >
          ← Edit
        </Link>

        {/* Centre: CV name */}
        <span className="text-sm font-medium text-(--cl-text) truncate">
          {cvName}
        </span>

        {/* Right: layout badge (desktop) + PDF button */}
        <div className="flex items-center gap-2 justify-self-end">
          <span className="hidden sm:inline-block text-xs text-(--cl-accent) bg-(--cl-pill) rounded px-2 py-0.5 font-medium shrink-0">
            {layoutName}
          </span>
          <ExportButton cvName={cvName} />
        </div>
      </div>
    </div>
  );
}
