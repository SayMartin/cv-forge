// Shared CV content types — used by layout components, view pages, and PDF export.
// These match the shapes returned by Prisma queries.

// Skill categories, in the order groups should be rendered on a CV.
// Single source of truth: the SkillsTab dropdown and every layout that groups
// skills read this list, so a new category appears in both without drifting.
// "Language" means spoken/natural languages — it drives the CEFR field in the
// editor and the CEFR table in the Europass layout. Programming languages go
// under "Programming".
export const SKILL_CATEGORIES = [
  "Programming",
  "Backend",
  "Frontend",
  "DevOps & Cloud",
  "Tools & methods",
  "Language",
  "Other",
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

// The one seeded category whose `kind` is "language". Kept as a derivation rule
// rather than a second list, so the names above stay the single source.
export const LANGUAGE_CATEGORY_NAME = "Language";

// Categories are user-owned rows; more than this many stops fitting a CV page.
// A layout limit, not a data one — enforced on create, never retroactively, so a
// migration can never make existing rows invalid.
export const MAX_SKILL_CATEGORIES = 8;

export type CvProfile = {
  id: string;
  profileName: string;
  name: string;
  headline?: string | null;
  bio?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  nationality?: string | null;
  dateOfBirth?: Date | null;
  drivingLicense?: string | null;
  social?: {
    linkedin?: string | null;
    github?: string | null;
    website?: string | null;
    portfolio?: string | null;
  } | null;
};

export type CvExperience = {
  id: string;
  company: string;
  role: string;
  startDate?: string | null;
  endDate?: string | null;
  current?: boolean | null;
  description?: string | null;
  url?: string | null;
  skills?: string[] | null;
};

export type CvEducation = {
  id: string;
  institution: string;
  degree?: string | null;
  field?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  current?: boolean | null;
  description?: string | null;
};

export type CvSkill = {
  id: string;
  name: string;
  // The category's display name — used for the group heading, which the user may
  // rename freely.
  category?: string | null;
  // The category's role: "language" | "normal". Layouts must branch on this, never
  // on `category`, so renaming a group cannot break the CEFR table or the language
  // section in any layout.
  categoryKind?: string | null;
  // The category's own sort position. This, not SKILL_CATEGORIES, decides group
  // order once the user has arranged their categories.
  categoryOrder?: number | null;
  level?: number | null;
  cefrLevel?: string | null; // A1–C2, only meaningful on a "language"-kind category
  icon?: string | null;
};

// True when a skill belongs to the spoken-language group, whatever it is called.
export function isLanguageSkill(skill: CvSkill): boolean {
  return skill.categoryKind === "language";
}

export type CvProject = {
  id: string;
  title: string;
  slug?: string | null;
  summary?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  current?: boolean | null;
  publishedAt?: string | null; // fallback date shown only when no start/end date is set
  imageUrl?: string | null;
  url?: string | null;
  sourceUrl?: string | null;
  skills?: string[] | null;
};

export type CvOther = {
  id: string;
  title: string;
  subtitle?: string | null;
  date?: string | null;
  description?: string | null;
  url?: string | null;
};

export type CvContent = {
  profile: CvProfile | null;
  avatarUrl: string | null;
  experiences: CvExperience[];
  educations: CvEducation[];
  skills: CvSkill[];
  projects: CvProject[];
  others: CvOther[];
};

// Groups skills for display, ordered by SKILL_CATEGORIES rather than by whatever
// order the rows happened to come back from the database in.
//
// Categories outside that list are kept and appended after the known ones, never
// dropped: rows written before the taxonomy changed still carry values like
// "Framework" or "Tool", and a skill must not silently vanish from a CV because
// its category is no longer offered in the editor.
export function groupSkillsByCategory(skills: CvSkill[]): [string, CvSkill[]][] {
  const groups = new Map<string, CvSkill[]>();
  for (const skill of skills) {
    const category = skill.category ?? "Other";
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category)!.push(skill);
  }

  const seedOrder = new Map<string, number>(SKILL_CATEGORIES.map((c, i) => [c, i]));

  // The user's own category order wins. SKILL_CATEGORIES is only a fallback, for
  // skills with no category at all; anything unrecognised sorts last.
  const rank = ([name, items]: [string, CvSkill[]]) =>
    items[0]?.categoryOrder ?? seedOrder.get(name) ?? SKILL_CATEGORIES.length;

  // Array.prototype.sort is stable, so equal ranks keep insertion order.
  return Array.from(groups.entries()).sort((a, b) => rank(a) - rank(b));
}
