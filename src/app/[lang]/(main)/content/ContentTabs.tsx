"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExperienceTab } from "./ExperienceTab";
import { EducationTab } from "./EducationTab";
import { SkillsTab } from "./SkillsTab";
import { ProjectsTab } from "./ProjectsTab";
import { OtherTab } from "./OtherTab";
import { ProfilesTab } from "./ProfilesTab";
import { AvatarsTab } from "./AvatarsTab";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { localeHref } from "@/i18n/routing";
import { useLocale } from "@/i18n/useLocale";

// Ids only. The labels live in `content.tabs`, keyed by these same ids, and the
// tab bar looks them up with `tabs[id]` — so a tab added here without a label
// there is a compile error at the lookup, not a blank button at runtime.
const TAB_IDS = [
  "profiles",
  "experience",
  "education",
  "skills",
  "projects",
  "other",
  "avatars",
] as const;

type TabId = (typeof TAB_IDS)[number];

export type Profile = {
  id: string;
  profileName: string;
  name: string;
  headline?: string;
  bio?: string;
  email?: string;
  phone?: string;
  location?: string;
  nationality?: string;
  dateOfBirth?: string;
  drivingLicense?: string;
  social?: { linkedin?: string; github?: string; website?: string; portfolio?: string };
};

export type Experience = {
  id: string;
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  url?: string;
  skills?: string[];
};

export type Education = {
  id: string;
  institution: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
};

// A skill carries no category and no order: both are per-CV decisions, held in
// cv.skillGroups.
export type Skill = {
  id: string;
  name: string;
  level?: number;
  cefrLevel?: string;
};

export type SkillCategoryOption = {
  id: string;
  name: string;
  kind: string; // "language" | "normal"
};

export type Project = {
  id: string;
  title: string;
  summary?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  url?: string;
  sourceUrl?: string;
  skills?: string[];
  publishedAt?: string;
};

export type Other = {
  id: string;
  title: string;
  subtitle?: string;
  date?: string;
  description?: string;
  url?: string;
  order?: number;
};

interface Props {
  initialProfiles: Profile[];
  initialExperiences: Experience[];
  initialEducations: Education[];
  initialSkills: Skill[];
  skillCategories: SkillCategoryOption[];
  initialProjects: Project[];
  initialOthers: Other[];
  initialAvatarImages: string[];
  /** Tab to open, from the ?tab= query. Unknown values fall back to the first tab. */
  initialTab?: string;
  /** The CV the user came from, carried along so switching tabs does not lose it. */
  returnToCvId?: string;
}

export default function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
        active
          ? "bg-(--cl-accent) text-white"
          : "text-(--cl-muted) hover:text-(--cl-text) hover:bg-(--cl-pill)"
      }`}
    >
      {children}
    </button>
  );
}

export function ContentTabs({
  initialProfiles,
  initialExperiences,
  initialEducations,
  initialSkills,
  skillCategories,
  initialProjects,
  initialOthers,
  initialAvatarImages,
  initialTab,
  returnToCvId,
}: Props) {
  const router = useRouter();
  const locale = useLocale();
  const { tabs } = useDictionary().content;
  const [activeTab, setActiveTab] = useState<TabId>(
    TAB_IDS.some((id) => id === initialTab) ? (initialTab as TabId) : "profiles",
  );

  // The open tab belongs in the URL: it is what makes a link from the CV editor
  // able to land on the right one. replace rather than push, so the browser's
  // back button still leaves the page instead of walking through the tabs.
  function selectTab(id: TabId) {
    setActiveTab(id);
    const query = new URLSearchParams({ tab: id });
    if (returnToCvId) query.set("from", returnToCvId);
    router.replace(localeHref(locale, `/content?${query}`), { scroll: false });
  }

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 flex-wrap border-b border-(--cl-border) pb-3">
        {TAB_IDS.map((id) => (
          <TabButton key={id} active={activeTab === id} onClick={() => selectTab(id)}>
            {tabs[id]}
          </TabButton>
        ))}
      </div>

      {/* Tab content */}
      <div className={activeTab === "profiles" ? "" : "hidden"}><ProfilesTab initialItems={initialProfiles} /></div>
      <div className={activeTab === "experience" ? "" : "hidden"}><ExperienceTab initialItems={initialExperiences} /></div>
      <div className={activeTab === "education" ? "" : "hidden"}><EducationTab initialItems={initialEducations} /></div>
      <div className={activeTab === "skills" ? "" : "hidden"}><SkillsTab initialItems={initialSkills} categories={skillCategories} /></div>
      <div className={activeTab === "projects" ? "" : "hidden"}><ProjectsTab initialItems={initialProjects} /></div>
      <div className={activeTab === "other" ? "" : "hidden"}><OtherTab initialItems={initialOthers} /></div>
      <div className={activeTab === "avatars" ? "" : "hidden"}><AvatarsTab initialImages={initialAvatarImages} /></div>
    </div>
  );
}
