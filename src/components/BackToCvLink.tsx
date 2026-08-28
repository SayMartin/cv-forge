"use client";

import { LocaleLink } from "@/components/LocaleLink";
import { useDictionary } from "@/i18n/DictionaryProvider";

// The way back to a CV the user stepped away from — from My Content, or from
// the preview. Both are detours out of an edit in progress rather than places
// in a hierarchy, so both get the same link instead of a trail.
//
// It names the destination, not the action: an earlier "← Edit" said what you
// would do rather than where you would land, which is the same reason the CV's
// own name carries the link here. "Back to" is spelled out because the bare
// name left the arrow doing all the explaining.
//
// Sized at `text-base` in full text colour rather than the muted `text-sm` most
// secondary links use. This is the way out of a detour, so it has to be findable
// at a glance — muted grey made it the quietest thing on a page that already
// carries a global nav above it.
export function BackToCvLink({
  cvId,
  cvName,
  className = "",
}: {
  cvId: string;
  cvName: string;
  className?: string;
}) {
  const { backTo } = useDictionary().editor.view;

  return (
    <LocaleLink
      href={`/cvs/${cvId}`}
      className={`inline-flex items-center gap-2 min-w-0 text-base text-(--cl-text) hover:text-(--cl-accent) transition-colors ${className}`}
    >
      {/* The arrow is decoration; a screen reader reads "Back to <name>". */}
      <span aria-hidden="true" className="shrink-0">
        ←
      </span>
      <span className="shrink-0">{backTo}</span>
      {/* Only the name truncates — losing "Back to" to a long CV name would
          leave a dangling arrow, which is the state this link moved away from. */}
      <span className="truncate font-medium">{cvName}</span>
    </LocaleLink>
  );
}
