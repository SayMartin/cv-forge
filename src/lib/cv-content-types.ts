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
  category?: string | null;
  level?: number | null;
  cefrLevel?: string | null; // A1–C2, only meaningful when category === "Language"
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

export type CvContent = {
  profile: CvProfile | null;
  avatarUrl: string | null;
  experiences: CvExperience[];
  educations: CvEducation[];
  skills: CvSkill[];
  projects: CvProject[];
  others: CvOther[];
};
