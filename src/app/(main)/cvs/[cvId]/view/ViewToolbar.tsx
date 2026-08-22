"use client";

import { BackToCvLink } from "@/components/BackToCvLink";
import { ExportButton } from "./ExportButton";

type Props = {
  cvId: string;
  cvName: string;
  layoutName: string;
};

export function ViewToolbar({ cvId, cvName, layoutName }: Props) {
  return (
    // Same container as the nav bar and the footer, so the back link lines up
    // under the logo and the PDF button under Sign out. No band of its own: the
    // white background and bottom border read as a third layer of chrome under
    // the nav, which is a lot of framing for one link and two controls.
    <div className="print:hidden max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
      {/* A trail said this page sits under the CV in a hierarchy, but the
          preview is a detour out of an edit in progress — the same shape as
          stepping over to My Content. So it gets the same link, and the way
          back to /cvs is the global nav rather than a segment nobody used. */}
      <BackToCvLink cvId={cvId} cvName={cvName} />

      {/* Right: layout badge (desktop) + PDF button */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden sm:inline-block text-xs text-(--cl-accent) bg-(--cl-pill) rounded px-2 py-0.5 font-medium shrink-0">
          {layoutName}
        </span>
        <ExportButton cvName={cvName} />
      </div>
    </div>
  );
}
