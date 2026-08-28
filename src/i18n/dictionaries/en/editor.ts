import type { SectionKey } from "@/lib/cv-layouts";

/**
 * The five CV content sections.
 *
 * One entry serves both the headings in the editor and the rows in the drag
 * list under "Section order" — they name the same five things, and a list that
 * stopped matching the headings above it would be a puzzle rather than a
 * control. This is what `SECTION_LABELS` in `cv-layouts.ts` used to be.
 *
 * Declared out here with an annotation rather than inline with `satisfies`, for
 * the same reason `en/index.ts` refuses `as const`: `satisfies` would keep the
 * values as string *literal* types, and the Swedish file could then only
 * satisfy the contract by containing the English words. The annotation widens
 * them to `string` while still requiring all five keys — so a sixth section
 * cannot ship without a label.
 *
 * The same five words appear in `content.tabs`. That is a different screen and
 * stays a separate key.
 */
const sections: Record<SectionKey, string> = {
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  other: "Other",
};

/**
 * The CV editor and the preview toolbar.
 *
 * Grouped by the control a string belongs to rather than by the file it is
 * rendered from: the sticky header's Save button lives in `CvEditor`, the
 * breadcrumb beside it in `CvEditShell`, and the leave-warning it triggers in
 * `UnsavedChangesGuard` — three files, one thing the user is looking at.
 *
 * Two strings are deliberately *not* here. "My CVs" and "My Content" name
 * destinations that already have names in `nav`, and a breadcrumb that says
 * something different from the nav item it points at is a bug you only notice
 * after both have been edited. They are read from `nav` at the use site; the
 * arrow after them is punctuation and stays in the JSX.
 */
export const editor = {
  /** aria-label on the CV `<select>` in the breadcrumb. */
  switchCv: "Switch CV",
  preview: "Preview",

  /**
   * The `confirm()` shown when leaving a CV with unsaved edits — passed into
   * `useUnsavedChangesWarning` rather than read there, because the guard is a
   * hook in a file with no dictionary of its own.
   *
   * This is not the `beforeunload` text: browsers replaced that with their own
   * wording years ago and ignore whatever a page supplies.
   */
  unsavedChanges: "This CV has unsaved changes. Leave without saving?",

  name: { label: "CV name" },

  targetRole: {
    label: "Tailored for",
    placeholder: "e.g. Acme Corp — Senior Designer",
    help: "Only shown in the CV list — not printed.",
  },

  // Four states of one button, so they sit together: a translation that made
  // "Save" and "Save changes" identical would be visible here.
  save: {
    idle: "Save",
    dirty: "Save changes",
    saving: "Saving…",
    saved: "Saved ✓",
    failed: "Save failed",
  },

  revert: {
    label: "Revert",
    confirm: "Discard all unsaved changes?",
  },

  deleteCv: {
    label: "Delete CV",
    deleting: "Deleting…",
    confirm: 'Delete "{name}"? This cannot be undone.',
    failed: "Delete failed",
  },

  /** The All/None chip in a section header; toggles the whole list below it. */
  selectAll: "All",
  selectNone: "None",

  /** aria-label on every drag handle — the entry lists and the section order. */
  dragToReorder: "Drag to reorder",

  layout: { title: "Layout" },

  theme: {
    title: "Colour theme",
    /** The "no theme" option — the layout's own colours. */
    none: "Default",
    create: "+ New theme",
    creating: "Creating…",
    /**
     * The name a new theme is created with — so this string is written to the
     * database, unlike everything else here.
     *
     * That is the same shape as the `SKILL_CATEGORIES` seeding the plan
     * deliberately deferred, but without the hazard that made it dangerous:
     * nothing resolves a theme by its name (CVs reference `themeId`), and the
     * rename box sits directly under the button that creates it. A Swedish user
     * getting "Min färgsättning" is a better default than an English one, and
     * nothing downstream can be confused by it.
     */
    newName: "My theme",
    /** The theme name saves on its own, so it reports on its own. */
    saved: "Saved ✓",
    delete: "Delete",
    confirmDelete: "Delete this theme? CVs using it will lose their colour settings.",
    sidebar: "Sidebar",
    accent: "Accent",
  },

  profile: { title: "Profile" },

  avatar: {
    title: "Avatar",
    /** Sits beside the photos as the "use none of them" choice. */
    none: "None",
    alt: "Avatar {number}",
  },

  sections,

  /**
   * How a picked entry is summarised in a checklist. Written as templates
   * rather than assembled in JSX so the separator is the translation's to
   * choose — Swedish sets an en dash differently, and a language that wanted a
   * comma could not ask for one from a string glued together in the component.
   */
  entries: {
    experience: "{role} @ {company}",
    education: "{degree} — {institution}",
    /** Shown when an education row has no degree recorded. */
    degreeFallback: "Degree",
    other: "{title} — {subtitle}",
  },

  skills: {
    /** The empty state inside a category, where chips are dropped. */
    dropHere: "Drag skills here",
    unplaced: "Not on this CV",
    allPlaced: "Every skill is placed.",
    /** aria-labels — the chips and category rows are drag targets, so each
        control has to say what it acts on, not just what it does. */
    include: "Include {name}",
    move: "Move {name} to another category",
    show: "Show {category} on this CV",
    reorder: "Reorder {category}",
  },

  timeline: {
    title: "Timeline",
    grouped: {
      label: "Grouped by section",
      description:
        "Experience, Education, Projects, and Other each render as their own block, in the order below.",
    },
    chronological: {
      label: "Mixed, chronological order",
      description:
        "Experience, Education, Projects, and Other are merged into one timeline sorted by date (most recent first). Skills stays separate.",
    },
  },

  sectionOrder: {
    title: "Section order",
    help: "Hold and drag to reorder sections in your CV.",
  },

  coverLetter: {
    title: "Cover letter",
    placeholder: "Write a cover letter for this application…",
    help: "Printed as a separate page before the CV when not empty.",
  },

  /** The preview page's toolbar. */
  view: {
    /** Prefixes the CV's name: "← Back to Backend Engineer 2026". */
    backTo: "Back to",
    exportPdf: "Save as PDF",
  },
};
