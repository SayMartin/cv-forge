// Merges Experience/Education/Projects/Other into one date-sorted timeline,
// for CV layouts' optional "chronological" mode. Skills has no dates and is
// never part of this — it stays its own separate section in every layout.

import type { CvContent, CvExperience, CvEducation, CvProject, CvOther } from "./cv-content-types";

export type TimelineEntry =
  | { type: "experience"; id: string; data: CvExperience }
  | { type: "education"; id: string; data: CvEducation }
  | { type: "projects"; id: string; data: CvProject }
  | { type: "other"; id: string; data: CvOther };

export const TIMELINE_TYPE_LABEL: Record<TimelineEntry["type"], string> = {
  experience: "Work",
  education: "Education",
  projects: "Project",
  other: "Other",
};

// "YYYY" or "YYYY-MM" (same format used by every layout's formatDate()) → a
// sortable numeric value. Missing/unparseable dates sort last.
function dateSortValue(dateStr?: string | null): number {
  if (!dateStr) return 0;
  if (/^\d{4}$/.test(dateStr)) return Number(dateStr) * 12;
  const [year, month] = dateStr.split("-");
  const y = Number(year);
  const m = Number(month);
  if (Number.isNaN(y)) return 0;
  return y * 12 + (Number.isNaN(m) ? 0 : m - 1);
}

// Ongoing/current entries have no end date but are the most recent — sort
// them above everything else, then by end date (falling back to start date,
// then to Project's publishedAt), most recent first.
function entrySortValue(entry: TimelineEntry): number {
  if (entry.type === "other") return dateSortValue(entry.data.date);

  const { current, endDate, startDate } = entry.data;
  if (current) return Infinity;

  const end = dateSortValue(endDate);
  if (end) return end;

  const start = dateSortValue(startDate);
  if (start) return start;

  if (entry.type === "projects" && entry.data.publishedAt) {
    return dateSortValue(entry.data.publishedAt);
  }
  return 0;
}

export function buildTimeline(content: CvContent): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    ...content.experiences.map((data): TimelineEntry => ({ type: "experience", id: data.id, data })),
    ...content.educations.map((data): TimelineEntry => ({ type: "education", id: data.id, data })),
    ...content.projects.map((data): TimelineEntry => ({ type: "projects", id: data.id, data })),
    ...content.others.map((data): TimelineEntry => ({ type: "other", id: data.id, data })),
  ];

  return entries.sort((a, b) => entrySortValue(b) - entrySortValue(a));
}
