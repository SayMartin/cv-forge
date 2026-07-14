"use client";

import { useRouter } from "next/navigation";

type CvEntry = { id: string; name: string };

export function CvSwitcher({
  cvs,
  currentId,
}: {
  cvs: CvEntry[];
  currentId: string;
}) {
  const router = useRouter();

  return (
    <select
      value={currentId}
      onChange={(e) => {
        if (e.target.value !== currentId) {
          router.push(`/cvs/${e.target.value}`);
        }
      }}
      className="text-sm border border-(--cl-border) rounded-lg px-3 py-1.5 bg-white text-(--cl-text) focus:outline-none focus:ring-2 focus:ring-(--cl-accent) max-w-xs truncate"
    >
      {cvs.map((cv) => (
        <option key={cv.id} value={cv.id}>
          {cv.name}
        </option>
      ))}
    </select>
  );
}
