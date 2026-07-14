import type { Metadata } from "next";
import { createElement } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLayoutComponent } from "@/components/cv-layouts";
import { getLayoutMeta, DEFAULT_SECTION_ORDER, type SectionKey } from "@/lib/cv-layouts";
import type { CvContent, CvProfile } from "@/lib/cv-content-types";
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

  if (!session) redirect(`/sign-in?callbackUrl=/cvs/${cvId}/view`);

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
  ] = await Promise.all([
    cv.profileId
      ? prisma.profile.findUnique({ where: { id: cv.profileId } })
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
      ? prisma.cvTheme.findUnique({ where: { id: cv.themeId } })
      : Promise.resolve(null),
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
    imageUrl: p.imageUrl,
    url: p.url,
    sourceUrl: p.sourceUrl,
    skills: p.skills,
  }));

  const content: CvContent = {
    profile,
    avatarUrl,
    experiences: byIds(experiences, cv.experienceIds),
    educations: byIds(educations, cv.educationIds),
    skills: byIds(skills, cv.skillIds),
    projects: byIds(projects, cv.projectIds),
    others: byIds(others, cv.otherIds),
  };

  const layoutMeta = getLayoutMeta(cv.layoutId);

  const sectionOrder = (
    cv.sectionOrder.length ? cv.sectionOrder : DEFAULT_SECTION_ORDER
  ) as SectionKey[];

  return (
    <div>
      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <ViewToolbar cvId={cvId} cvName={cv.name} layoutName={layoutMeta.name} />

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
        })}
      </CvScaleWrapper>
    </div>
  );
}
