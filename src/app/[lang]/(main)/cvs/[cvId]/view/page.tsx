import type { Metadata } from "next";
import { createElement } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getDictionary, localePath } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLayoutComponent } from "@/components/cv-layouts";
import { resolveLayoutId, DEFAULT_SECTION_ORDER, type SectionKey } from "@/lib/cv-layouts";
import type { CvContent, CvProfile, CvSkillGroup } from "@/lib/cv-content-types";
import { CvScaleWrapper } from "./CvScaleWrapper";
import { ViewToolbar } from "./ViewToolbar";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ cvId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { cvId } = await params;
  const cv = await prisma.cV.findUnique({ where: { id: cvId }, select: { name: true } });
  return { title: cv?.name ? `${cv.name} — Preview` : "CV Preview" };
}

export default async function CvViewPage({ params }: Params) {
  const [session, { cvId }] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    params,
  ]);

  if (!session) redirect(await localePath(`/sign-in?callbackUrl=/cvs/${cvId}/view`));

  const userId = session.user.id;

  const cv = await prisma.cV.findUnique({ where: { id: cvId } });
  if (!cv || cv.userId !== userId) notFound();

  const [
    rawProfile,
    avatarDoc,
    experiences,
    educations,
    skills,
    rawProjects,
    others,
    theme,
    skillCategories,
  ] = await Promise.all([
    cv.profileId
      ? prisma.profile.findFirst({ where: { id: cv.profileId, userId } })
      : Promise.resolve(null),
    prisma.avatar.findUnique({ where: { userId } }),
    cv.experienceIds.length
      ? prisma.experience.findMany({ where: { id: { in: cv.experienceIds }, userId } })
      : Promise.resolve([]),
    cv.educationIds.length
      ? prisma.education.findMany({ where: { id: { in: cv.educationIds }, userId } })
      : Promise.resolve([]),
    cv.skillIds.length
      ? prisma.skill.findMany({ where: { id: { in: cv.skillIds }, userId } })
      : Promise.resolve([]),
    cv.projectIds.length
      ? prisma.project.findMany({ where: { id: { in: cv.projectIds }, userId } })
      : Promise.resolve([]),
    cv.otherIds.length
      ? prisma.other.findMany({ where: { id: { in: cv.otherIds }, userId } })
      : Promise.resolve([]),
    cv.themeId
      ? prisma.cvTheme.findFirst({ where: { id: cv.themeId, userId } })
      : Promise.resolve(null),
    prisma.skillCategory.findMany({
      where: { userId },
      select: { id: true, name: true, kind: true },
    }),
  ]);

  const avatarUrl =
    cv.avatarIndex !== null &&
    cv.avatarIndex !== undefined &&
    avatarDoc?.images?.[cv.avatarIndex]
      ? avatarDoc.images[cv.avatarIndex]
      : null;

  // Restore user-chosen order
  function byIds<T extends { id: string }>(items: T[], ids: string[]): T[] {
    return ids.flatMap((id) => items.find((x) => x.id === id) ?? []);
  }

  const profile: CvProfile | null = rawProfile
    ? {
        id: rawProfile.id,
        profileName: rawProfile.profileName,
        name: rawProfile.name ?? "",
        headline: rawProfile.headline,
        bio: rawProfile.bio,
        email: rawProfile.email,
        phone: rawProfile.phone,
        location: rawProfile.location,
        nationality: rawProfile.nationality,
        dateOfBirth: rawProfile.dateOfBirth,
        drivingLicense: rawProfile.drivingLicense,
        social: {
          linkedin: rawProfile.linkedin,
          github: rawProfile.github,
          website: rawProfile.website,
          portfolio: rawProfile.portfolio,
        },
      }
    : null;

  const projects = rawProjects.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    summary: p.summary,
    startDate: p.startDate,
    endDate: p.endDate,
    current: p.current,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString().slice(0, 10) : null,
    imageUrl: p.imageUrl,
    url: p.url,
    sourceUrl: p.sourceUrl,
    skills: p.skills,
  }));

  // Resolve the CV's own skills arrangement into ready-to-render groups. Three
  // things are dropped here rather than in every layout: groups the user hid,
  // skills they did not select, and categories that have since been deleted.
  // An emptied group is dropped too — a heading with nothing under it is noise.
  const categoryById = new Map(skillCategories.map((c) => [c.id, c]));
  const skillById = new Map(skills.map((s) => [s.id, s]));
  const selected = new Set(cv.skillIds);

  const skillGroups = ((cv.skillGroups as CvSkillGroup[] | null) ?? [])
    .filter((group) => !group.hidden)
    .flatMap((group) => {
      const category = categoryById.get(group.categoryId);
      if (!category) return [];

      const groupSkills = (group.skillIds ?? [])
        .filter((id) => selected.has(id))
        .map((id) => skillById.get(id))
        .filter((s): s is (typeof skills)[number] => Boolean(s));

      if (groupSkills.length === 0) return [];

      return [{
        categoryId: category.id,
        name: category.name,
        kind: category.kind,
        skills: groupSkills,
      }];
    });

  const content: CvContent = {
    profile,
    avatarUrl,
    experiences: byIds(experiences, cv.experienceIds),
    educations: byIds(educations, cv.educationIds),
    skills: skillGroups.flatMap((g) => g.skills),
    skillGroups,
    projects: byIds(projects, cv.projectIds),
    others: byIds(others, cv.otherIds),
  };

  // The badge names the layout in the *UI* language: it labels a control on
  // this page, not anything printed on the CV.
  const { layouts } = await getDictionary();
  const layoutName = layouts[resolveLayoutId(cv.layoutId)].name;

  const sectionOrder = (
    cv.sectionOrder.length ? cv.sectionOrder : DEFAULT_SECTION_ORDER
  ) as SectionKey[];

  return (
    <div>
      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <ViewToolbar cvId={cvId} cvName={cv.name} layoutName={layoutName} />

      {/* ── Cover letter (print page, hidden on screen) ──────────── */}
      {cv.coverLetter && (
        <div className="hidden print:block print:page-break-after-always px-16 py-20 font-sans text-sm leading-relaxed whitespace-pre-wrap">
          {cv.coverLetter}
        </div>
      )}

      {/* ── CV Layout ────────────────────────────────────────────── */}
      <CvScaleWrapper>
        {createElement(getLayoutComponent(cv.layoutId), {
          content,
          theme: theme ?? undefined,
          sectionOrder,
          chronological: cv.chronological,
        })}
      </CvScaleWrapper>
    </div>
  );
}
