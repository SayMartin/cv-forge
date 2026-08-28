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
  // Split out of a single "DevOps & Cloud": the practice and the platform are
  // different things to a reader. "DevOps & Infrastructure" is what you *do*
  // — CI/CD, containers, orchestration, IaC, monitoring, the servers
  // themselves. "Cloud & Edge" is what you deploy *onto* — the providers and
  // their managed, serverless and edge products.
  "DevOps & Infrastructure",
  "Cloud & Edge",
  "Tools & methods",
  "Language",
  "Other",
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

// The one seeded category whose `kind` is "language". Kept as a derivation rule
// rather than a second list, so the names above stay the single source.
export const LANGUAGE_CATEGORY_NAME = "Language";

// One group in a CV's skills section. Array position is display order, both for
// the groups themselves and for the skills inside them.
//
// `hidden` exists so a category can be taken off a CV without losing where its
// skills were placed — removing the group instead would discard that arrangement,
// and the user would have to rebuild it to bring the category back.
export type CvSkillGroup = {
  categoryId: string;
  hidden?: boolean;
  skillIds: string[];
};

// Categories are user-owned rows; more than this many stops fitting a CV page.
// A layout limit, not a data one — enforced on create, never retroactively, so a
// migration can never make existing rows invalid.
//
// **Keep this strictly above `SKILL_CATEGORIES.length`.** The seeded set is
// written to every new account at signup, so a cap equal to it puts a brand-new
// user on the limit before they have done anything — the manager just says
// "Limit reached" and the first custom category costs a deletion. The headroom
// is the point, not the number.
export const MAX_SKILL_CATEGORIES = 9;

// Quoted back to the user by the `name_too_long` error, so it has to be a
// value the route can pass rather than a literal repeated in two handlers.
export const MAX_CATEGORY_NAME = 40;

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

// A skill carries no category: which group it appears under is a per-CV decision,
// resolved into CvSkillSection before a layout sees it.
export type CvSkill = {
  id: string;
  name: string;
  level?: number | null;
  cefrLevel?: string | null; // A1–C2, rendered only inside a "language"-kind group
  icon?: string | null;
};


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

// One rendered skills group, already resolved by the view page: hidden groups,
// unselected skills and categories that no longer exist are gone by the time a
// layout sees this. Layouts render it as given — they no longer group anything
// themselves, because grouping is now a per-CV decision rather than a property of
// the data.
export type CvSkillSection = {
  categoryId: string;
  name: string;
  kind: string; // "language" | "normal"
  skills: CvSkill[];
};

export type CvContent = {
  profile: CvProfile | null;
  avatarUrl: string | null;
  experiences: CvExperience[];
  educations: CvEducation[];
  // Flat list of every skill that survived selection — for "is this section empty"
  // checks. The arrangement lives in skillGroups.
  skills: CvSkill[];
  skillGroups: CvSkillSection[];
  projects: CvProject[];
  others: CvOther[];
};


