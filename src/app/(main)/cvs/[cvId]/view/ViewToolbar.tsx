"use client";

import { Breadcrumbs, CrumbLink, CrumbCurrent } from "@/components/Breadcrumbs";
import { ExportButton } from "./ExportButton";

type Props = {
  cvId: string;
  cvName: string;
  layoutName: string;
};

export function ViewToolbar({ cvId, cvName, layoutName }: Props) {
  return (
    <div className="bg-white border-b border-(--cl-border) print:hidden">
      {/* Same container as the nav bar and the footer, so the trail lines up under
          the logo and the PDF button under Sign out. A full-bleed row pushed both
          to the window edges while every other band on the page stayed centred. */}
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        {/* The way back is the CV's own name. "← Edit" named an action rather
            than a destination, and sat in muted grey below the global nav — the
            least prominent thing on a page that carries three layers of chrome. */}
        <Breadcrumbs>
          <CrumbLink href="/cvs">My CVs</CrumbLink>
          <CrumbLink href={`/cvs/${cvId}`}>{cvName}</CrumbLink>
          <CrumbCurrent>Preview</CrumbCurrent>
        </Breadcrumbs>

        {/* Right: layout badge (desktop) + PDF button */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-block text-xs text-(--cl-accent) bg-(--cl-pill) rounded px-2 py-0.5 font-medium shrink-0">
            {layoutName}
          </span>
          <ExportButton cvName={cvName} />
        </div>
      </div>
    </div>
  );
}
