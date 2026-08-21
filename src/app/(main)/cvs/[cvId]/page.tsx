export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CvEditShell } from "./CvEditShell";

type Params = { params: Promise<{ cvId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { cvId } = await params;
  const cv = await prisma.cV.findUnique({ where: { id: cvId }, select: { name: true } });
  return { title: cv?.name ?? "CV Editor" };
}

export default async function CvEditorPage({ params }: Params) {
  const [session, { cvId }] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    params,
  ]);

  if (!session) redirect("/sign-in?callbackUrl=/cvs");

  const userId = session.user.id;

  const [
    cv,
    allCvs,
    rawProfiles,
    avatarDoc,
    experiences,
    educations,
    skills,
    rawProjects,
    others,
    themes,
  ] = await Promise.all([
    prisma.cV.findUnique({ where: { id: cvId } }),
    prisma.cV.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, select: { id: true, name: true } }),
    prisma.profile.findMany({ where: { userId }, orderBy: { profileName: "asc" } }),
    prisma.avatar.findUnique({ where: { userId } }),
    prisma.experience.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.education.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.skill.findMany({
      where: { userId },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: { category: true },
    }),
    prisma.project.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.other.findMany({ where: { userId }, orderBy: [{ order: "asc" }, { createdAt: "desc" }] }),
    prisma.cvTheme.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, sidebarColor: true, accentColor: true },
    }),
  ]);

  if (!cv || cv.userId !== userId) notFound();

  const profiles = rawProfiles.map((p) => ({
    id: p.id,
    profileName: p.profileName,
    name: p.name ?? "",
    headline: p.headline ?? undefined,
    social: { linkedin: p.linkedin ?? undefined, github: p.github ?? undefined, website: p.website ?? undefined, portfolio: p.portfolio ?? undefined },
  }));

  const projects = rawProjects.map((p) => ({
    id: p.id,
    title: p.title,
    summary: p.summary ?? undefined,
    url: p.url ?? undefined,
    sourceUrl: p.sourceUrl ?? undefined,
    skills: p.skills,
    publishedAt: p.publishedAt?.toISOString() ?? undefined,
  }));

  const mappedExperiences = experiences.map((e) => ({
    id: e.id,
    company: e.company,
    role: e.role,
    startDate: e.startDate ?? undefined,
    endDate: e.endDate ?? undefined,
    current: e.current,
    description: e.description ?? undefined,
    skills: e.skills,
  }));

  const mappedEducations = educations.map((e) => ({
    id: e.id,
    institution: e.institution,
    degree: e.degree ?? undefined,
    field: e.field ?? undefined,
    startDate: e.startDate ?? undefined,
    endDate: e.endDate ?? undefined,
    current: e.current,
    description: e.description ?? undefined,
  }));

  const mappedSkills = skills.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category?.name ?? undefined,
    level: s.level ?? undefined,
    order: s.order,
  }));

  const mappedOthers = others.map((o) => ({
    id: o.id,
    title: o.title,
    subtitle: o.subtitle ?? undefined,
    date: o.date ?? undefined,
    description: o.description ?? undefined,
    url: o.url ?? undefined,
    order: o.order,
  }));

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <CvEditShell
          cvs={allCvs}
          cvId={cv.id}
          initialName={cv.name}
          initialLayoutId={cv.layoutId}
          initialThemeId={cv.themeId ?? null}
          initialProfileId={cv.profileId}
          initialAvatarIndex={cv.avatarIndex ?? null}
          initialExperienceIds={cv.experienceIds}
          initialEducationIds={cv.educationIds}
          initialSkillIds={cv.skillIds}
          initialProjectIds={cv.projectIds}
          initialOtherIds={cv.otherIds ?? []}
          initialTargetRole={cv.targetRole ?? null}
          initialCoverLetter={cv.coverLetter ?? null}
          initialSectionOrder={cv.sectionOrder?.length ? cv.sectionOrder : undefined}
          initialChronological={cv.chronological}
          profiles={profiles}
          avatarDoc={avatarDoc ? { id: avatarDoc.id, images: avatarDoc.images } : null}
          experiences={mappedExperiences}
          educations={mappedEducations}
          skills={mappedSkills}
          projects={projects}
          others={mappedOthers}
          themes={themes}
        />
      </div>
    </main>
  );
}
