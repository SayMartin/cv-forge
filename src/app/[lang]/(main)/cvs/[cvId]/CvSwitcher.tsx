"use client";

import { useRouter } from "next/navigation";

type CvEntry = { id: string; name: string };

export function CvSwitcher({
  cvs,
  currentId,
  onBeforeSwitch,
}: {
  cvs: CvEntry[];
  currentId: string;
  /** Return false to cancel — used to warn about unsaved changes. */
  onBeforeSwitch?: () => boolean;
}) {
  const router = useRouter();

  return (
    <select
      value={currentId}
      onChange={(e) => {
        if (e.target.value === currentId) return;
        if (onBeforeSwitch && !onBeforeSwitch()) {
          // Nothing re-renders when the navigation is cancelled, so the select
          // would sit showing a CV that was never opened. Put it back by hand.
          e.target.value = currentId;
          return;
        }
        router.push(`/cvs/${e.target.value}`);
      }}
      aria-label="Switch CV"
      // Sits as the last segment of the breadcrumb, so it carries the weight of a
      // page title while keeping enough border to still read as a control.
      className="text-sm font-medium border border-(--cl-border) rounded-lg px-2.5 py-1 bg-white text-(--cl-text) hover:border-(--cl-accent) focus:outline-none focus:ring-2 focus:ring-(--cl-accent) max-w-[16rem] truncate transition-colors"
    >
      {cvs.map((cv) => (
        <option key={cv.id} value={cv.id}>
          {cv.name}
        </option>
      ))}
    </select>
  );
}
