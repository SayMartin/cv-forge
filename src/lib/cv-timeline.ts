// Merges Experience/Education/Projects/Other into one date-sorted timeline,
// for CV layouts' optional "chronological" mode. Skills has no dates and is
// never part of this — it stays its own separate section in every layout.

import type { CvContent, CvExperience, CvEducation, CvProject, CvOther } from "./cv-content-types";

export type TimelineEntry =
  | { type: "experience"; id: string; data: CvExperience }
  | { type: "education"; id: string; data: CvEducation }
  | { type: "projects"; id: string; data: CvProject }
  | { type: "other"; id: string; data: CvOther };

// The badge labels that used to live here are now `cvStrings(language)
// .timelineType`. They are printed on the CV, so they follow the CV's own
// language — and this module is pure date-sorting logic that has no business
// knowing about languages at all.

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

// An ongoing entry has no end date, but it does have an end: later than every
// date that exists. Making that explicit is what lets `current` be an ordinary
// value in the comparison instead of a special case ahead of it.
const ONGOING = Number.POSITIVE_INFINITY;

type SortKey = { start: number; end: number };

/**
 * **Start date descending, end date descending as the tie-break** — one rule,
 * applied to every entry type.
 *
 * The point of the second key is not tidiness. Without it, entries that share a
 * start date fall back to the order they happen to sit in `CvContent`, which is
 * grouped by type: every experience, then every education, then projects, then
 * others. So a merged timeline would break its own descending order at each
 * tie, and the tie is common — an ongoing role and an ongoing side project both
 * "end" at the same place. That looked like a shuffle rather than a sort.
 *
 * Sorting on the *start* is what makes the date column readable: it descends
 * monotonically down the page, so a reader scanning the left-hand dates never
 * meets a row that goes back up. Sorting on the end (what this used to do) does
 * not have that property — a short recent entry and a long-running old one can
 * end in the same month, and the ladder breaks.
 *
 * The consequence worth knowing: an entry ongoing since 2015 now sits where its
 * *start* puts it, below a job that ran Mar–Apr 2026, rather than being pinned
 * to the top by `current`. That is the same rule, honestly applied — the row
 * says "2015–" and belongs where 2015 belongs.
 */
function sortKey(entry: TimelineEntry): SortKey {
  // "Other" carries a single date, so it starts and ends in the same month.
  if (entry.type === "other") {
    const at = dateSortValue(entry.data.date);
    return { start: at, end: at };
  }

  const { current, startDate, endDate } = entry.data;
  const start = dateSortValue(startDate);
  const end = current ? ONGOING : dateSortValue(endDate);

  // Whatever real date this entry does have, for filling in the key it is
  // missing — an entry with only an end date should still sort by that date
  // rather than dropping to the bottom with the undated ones. `current`
  // deliberately does not count: "ongoing" says nothing about *when*, so
  // `Number.isFinite` filters the sentinel back out.
  const known =
    start ||
    (Number.isFinite(end) ? end : 0) ||
    (entry.type === "projects" ? dateSortValue(entry.data.publishedAt) : 0);

  // `||` is doing the fallback because 0 is precisely the "no date" sentinel
  // from dateSortValue. ONGOING is truthy, so it survives.
  return { start: start || known, end: end || known };
}

// Explicit comparison rather than `b - a`: the subtraction returns NaN for two
// ongoing entries (Infinity - Infinity), and while the sort spec quietly reads
// that as 0, a comparator that produces NaN in a routine case is a trap for
// whoever adds the third key.
function descending(a: number, b: number): number {
  if (a === b) return 0;
  return a > b ? -1 : 1;
}

export function buildTimeline(content: CvContent): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    ...content.experiences.map((data): TimelineEntry => ({ type: "experience", id: data.id, data })),
    ...content.educations.map((data): TimelineEntry => ({ type: "education", id: data.id, data })),
    ...content.projects.map((data): TimelineEntry => ({ type: "projects", id: data.id, data })),
    ...content.others.map((data): TimelineEntry => ({ type: "other", id: data.id, data })),
  ];

  // Entries that match on both dates keep the order they were entered in —
  // Array.prototype.sort is stable, so two projects both running "May 2026 –"
  // stay in the order the user arranged them in My Content. That is the right
  // last word: it is the only ordering left that the user actually chose.
  return entries.sort((a, b) => {
    const ka = sortKey(a);
    const kb = sortKey(b);
    return descending(ka.start, kb.start) || descending(ka.end, kb.end);
  });
}
