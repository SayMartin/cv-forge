// Layout registry — all available CV layouts.
//
// To add a new layout:
//   1. Create src/components/cv-layouts/YourLayout.tsx
//   2. Add its id to LAYOUT_IDS below
//   3. Add the component to LAYOUT_COMPONENTS (src/components/cv-layouts/index.ts)
//   4. Add its name and description to BOTH dictionaries (src/i18n/dictionaries/*/layouts.ts)
//
// Steps 3 and 4 are not reminders — they are compile errors. All three maps are
// keyed by `LayoutId`, so a new id that is missing anywhere fails to build.
//
// The `id` is stored in the `cv.layoutId` column in Neon, so these strings are
// data and must not be renamed. The *names* users read are not here: they moved
// to the dictionary, because a layout picker is UI and follows the UI locale.

export const LAYOUT_IDS = [
  "default",
  "modern",
  "teal",
  "slate",
  "terminal",
  "europass",
  // Placeholder slots — components to be built in future steps:
  // "minimal", "compact",
] as const;

export type LayoutId = (typeof LAYOUT_IDS)[number];

export const DEFAULT_LAYOUT_ID: LayoutId = "default";

export const SECTION_KEYS = ["experience", "education", "skills", "projects", "other"] as const;
export type SectionKey = typeof SECTION_KEYS[number];

export const DEFAULT_SECTION_ORDER: SectionKey[] = [...SECTION_KEYS];

/**
 * Narrows a `cv.layoutId` read from the database to a known layout.
 *
 * The column is a plain `String`, so it can hold the id of a layout that was
 * removed from this file — falling back to the default is what keeps such a CV
 * rendering instead of throwing. Callers get a `LayoutId`, which is what makes
 * `dict.layouts[…]` type-check without a cast at every site.
 */
export function resolveLayoutId(id: string): LayoutId {
  return (LAYOUT_IDS as readonly string[]).includes(id) ? (id as LayoutId) : DEFAULT_LAYOUT_ID;
}
