export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContentTabs } from "./ContentTabs";
import type { Profile, Experience, Education, Skill, Project, Other } from "./ContentTabs";

export const metadata: Metadata = { title: "My Content" };

export default async function ContentPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in?callbackUrl=/content");

  const userId = session.user.id;

  const [rawProfiles, experiences, educations, skills, rawProjects, others, avatarDoc] =
    await Promise.all([
      prisma.profile.findMany({ where: { userId }, orderBy: { profileName: "asc" } }),
      prisma.experience.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.education.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.skill.findMany({ where: { userId }, orderBy: [{ order: "asc" }, { name: "asc" }] }),
      prisma.project.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.other.findMany({ where: { userId }, orderBy: [{ order: "asc" }, { createdAt: "desc" }] }),
      prisma.avatar.findUnique({ where: { userId } }),
    ]);

  const profiles: Profile[] = rawProfiles.map((p) => ({
    id: p.id,
    profileName: p.profileName,
    name: p.name ?? "",
    headline: p.headline ?? undefined,
    bio: p.bio ?? undefined,
    email: p.email ?? undefined,
    phone: p.phone ?? undefined,
    location: p.location ?? undefined,
    social: { linkedin: p.linkedin ?? undefined, github: p.github ?? undefined, website: p.website ?? undefined, portfolio: p.portfolio ?? undefined },
  }));

  const projects: Project[] = rawProjects.map((p) => ({
    id: p.id,
    title: p.title,
    summary: p.summary ?? undefined,
    url: p.url ?? undefined,
    sourceUrl: p.sourceUrl ?? undefined,
    skills: p.skills,
    publishedAt: p.publishedAt?.toISOString() ?? undefined,
  }));

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-(--cl-text)">
            My Content
          </h1>
          <p className="text-sm text-(--cl-muted) mt-1">
            Manage your career content. Everything here can be added to a CV.
          </p>
        </div>
        <ContentTabs
          initialProfiles={profiles}
          initialExperiences={experiences as Experience[]}
          initialEducations={educations as Education[]}
          initialSkills={skills as Skill[]}
          initialProjects={projects}
          initialOthers={others as Other[]}
          initialAvatarImages={avatarDoc?.images ?? []}
        />
      </div>
    </main>
  );
}
