"use client";

import { useState } from "react";
import { ExperienceTab } from "./ExperienceTab";
import { EducationTab } from "./EducationTab";
import { SkillsTab } from "./SkillsTab";
import { ProjectsTab } from "./ProjectsTab";
import { OtherTab } from "./OtherTab";
import { ProfilesTab } from "./ProfilesTab";
import { AvatarsTab } from "./AvatarsTab";

const TABS = [
  { id: "profiles", label: "Profiles" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "other", label: "Other" },
  { id: "avatars", label: "Avatars" },
] as const;

type TabId = (typeof TABS)[number]["id"];

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

export type Skill = {
  id: string;
  name: string;
  category?: string;
  level?: number;
  cefrLevel?: string;
  order?: number;
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
  initialProjects: Project[];
  initialOthers: Other[];
  initialAvatarImages: string[];
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
  initialProjects,
  initialOthers,
  initialAvatarImages,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("profiles");

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 flex-wrap border-b border-(--cl-border) pb-3">
        {TABS.map((tab) => (
          <TabButton
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </TabButton>
        ))}
      </div>

      {/* Tab content */}
      <div className={activeTab === "profiles" ? "" : "hidden"}><ProfilesTab initialItems={initialProfiles} /></div>
      <div className={activeTab === "experience" ? "" : "hidden"}><ExperienceTab initialItems={initialExperiences} /></div>
      <div className={activeTab === "education" ? "" : "hidden"}><EducationTab initialItems={initialEducations} /></div>
      <div className={activeTab === "skills" ? "" : "hidden"}><SkillsTab initialItems={initialSkills} /></div>
      <div className={activeTab === "projects" ? "" : "hidden"}><ProjectsTab initialItems={initialProjects} /></div>
      <div className={activeTab === "other" ? "" : "hidden"}><OtherTab initialItems={initialOthers} /></div>
      <div className={activeTab === "avatars" ? "" : "hidden"}><AvatarsTab initialImages={initialAvatarImages} /></div>
    </div>
  );
}
