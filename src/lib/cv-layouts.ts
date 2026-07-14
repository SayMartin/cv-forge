// Layout registry — all available CV layouts.
//
// To add a new layout:
//   1. Create src/components/cv-layouts/YourLayout.tsx
//   2. Add an entry to CV_LAYOUTS below
//
// The `id` is stored in the `cv.layoutId` column in Neon.
// The component is imported lazily in the view page and PDF export route.

export type CvLayoutMeta = {
  id: string;
  name: string;
  description: string;
};

export const CV_LAYOUTS: CvLayoutMeta[] = [
  {
    id: "default",
    name: "Classic",
    description: "Clean typography on a light grey background.",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Two-column layout with dark sidebar and gold accents.",
  },
  {
    id: "teal",
    name: "Teal",
    description: "Teal sidebar with progress bars and bold section headers.",
  },
  {
    id: "slate",
    name: "Slate",
    description: "Dark slate sidebar with indigo accents, grouped skills with dot ratings, and clean pill-style tech tags.",
  },
  {
    id: "terminal",
    name: "Terminal",
    description: "Dark GitHub-style layout with monospace type and code-tag skills. Built for developers.",
  },
  // Placeholder slots — components to be built in future steps:
  // { id: "minimal",  name: "Minimal",  description: "Pure white, generous whitespace, no decorations." },
  // { id: "compact",  name: "Compact",  description: "Dense layout optimised for one page." },
];

export const DEFAULT_LAYOUT_ID = "default";

export const SECTION_KEYS = ["experience", "education", "skills", "projects", "other"] as const;
export type SectionKey = typeof SECTION_KEYS[number];

export const SECTION_LABELS: Record<SectionKey, string> = {
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  other: "Other",
};

export const DEFAULT_SECTION_ORDER: SectionKey[] = [...SECTION_KEYS];

export function getLayoutMeta(id: string): CvLayoutMeta {
  return CV_LAYOUTS.find((l) => l.id === id) ?? CV_LAYOUTS[0];
}
