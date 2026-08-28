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
    // Pinned for the same reason as the editor's header: the preview is several
    // A4 pages tall, and both the way out and "Save as PDF" were reachable only
    // by scrolling back to the top.
    //
    // This toolbar deliberately had no band of its own — one link and two
    // controls did not need a third layer of chrome under the nav. Sticking it
    // settles that differently: page content now scrolls underneath, so an
    // opaque background stops being decoration and becomes a requirement. The
    // band it gains is the same one the editor's header carries, so the two CV
    // pages read as one pattern rather than as two ideas.
    //
    // Same container as the nav bar and the footer, so the back link lines up
    // under the logo and the PDF button under Sign out.
    //
    // Sticky survives `CvScaleWrapper`'s `overflow-hidden` because that wrapper
    // is this toolbar's sibling, not its ancestor — the scroll container here is
    // still the document.
    <div className="print:hidden sticky top-0 z-30 border-b border-(--cl-border) bg-(--cl-bg)">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        {/* A trail said this page sits under the CV in a hierarchy, but the
            preview is a detour out of an edit in progress — the same shape as
            stepping over to My Content. So it gets the same link, and the way
            back to /cvs is the global nav rather than a segment nobody used. */}
        <BackToCvLink cvId={cvId} cvName={cvName} />

        {/* Right: layout badge (desktop) + PDF button */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-block text-sm text-(--cl-accent) bg-(--cl-pill) rounded px-2 py-0.5 font-medium shrink-0">
            {layoutName}
          </span>
          <ExportButton cvName={cvName} />
        </div>
      </div>
    </div>
  );
}
