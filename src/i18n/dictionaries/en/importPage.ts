import type { PluralForms } from "@/i18n/format";

// `importPage`, not `import` — `import` is a reserved word, so a slice named
// that could not be imported by name anywhere.

// Typed as a group rather than each form being annotated separately, so a sixth
// counter added here is one compile error in the Swedish file instead of a
// silently untranslated line.
type CountKey = "experience" | "education" | "skills" | "projects" | "other";

const counts: Record<CountKey, PluralForms> = {
  experience: {
    one: "{count} experience entry",
    other: "{count} experience entries",
  },
  education: {
    one: "{count} education entry",
    other: "{count} education entries",
  },
  skills: { one: "{count} skill", other: "{count} skills" },
  projects: { one: "{count} project", other: "{count} projects" },
  other: { one: "{count} other entry", other: "{count} other entries" },
};

export const importPage = {
  title: "Import CV from PDF",
  intro:
    "Upload a PDF CV and the content will be extracted by AI and added to your content library. A new profile will be created from your personal details. All other entries — experience, education, skills, projects, and certifications — are added as new items ready to use in your CVs.",

  // Stated before the file picker rather than returned as an error afterwards —
  // the upload is the slow part.
  limits: "Up to 10 pages and 10 MB.",

  selectFile: "Click to select a PDF…",
  submit: "Import CV",
  submitting: "Importing…",

  /** The only failure raised on this side of the wire; the rest come from the API. */
  networkError: "Network error — please try again.",

  success: {
    title: "Import successful ✓",
    profile: "Profile created",
    counts,
    review: "Review and edit in {myContent}.",
  },

  failure: {
    title: "Import failed",
  },
};
