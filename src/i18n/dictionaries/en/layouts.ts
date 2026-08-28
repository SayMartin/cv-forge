import type { LayoutId } from "@/lib/cv-layouts";

/**
 * The names and blurbs for the six CV layouts.
 *
 * These followed the layout registry until now, next to the `id` — but the id
 * is a database value and the name is a label a user reads, so a Swedish user
 * picking a layout should read Swedish. They are UI, and UI follows the *UI*
 * locale, not the CV's own language: the picker sits in the editor's chrome,
 * not on the document. (`SECTION_LABELS` moved out of the same file for the
 * same reason — see `editor.sections`. The CV's own headings are a separate
 * thing entirely and arrive in step 7.)
 *
 * Annotated `Record<LayoutId, …>` rather than left to inference, which is what
 * makes this a contract: a seventh layout added to `LAYOUT_IDS` fails to
 * compile here until it has a name, in both languages. The annotation also
 * widens the values to `string`, so this stays a valid reference shape for the
 * Swedish file — the same reason `en/index.ts` must never use `as const`.
 *
 * `description` is not rendered anywhere today; it was written for the picker
 * and the picker shows only the thumbnail and the name. It is kept because
 * deleting user-facing copy is a decision of its own, not a side effect of
 * translating it.
 */
export const layouts: Record<LayoutId, { name: string; description: string }> = {
  default: {
    name: "Classic",
    description: "Clean typography on a light grey background.",
  },
  modern: {
    name: "Modern",
    description: "Two-column layout with dark sidebar and gold accents.",
  },
  teal: {
    name: "Teal",
    description: "Teal sidebar with progress bars and bold section headers.",
  },
  slate: {
    name: "Slate",
    description:
      "Dark slate sidebar with indigo accents, grouped skills with dot ratings, and clean pill-style tech tags.",
  },
  terminal: {
    name: "Terminal",
    description:
      "Dark GitHub-style layout with monospace type and code-tag skills. Built for developers.",
  },
  europass: {
    name: "Europass",
    description:
      "EU-standardised CV structure with personal details, CEFR language table, and dated timeline sections.",
  },
};
