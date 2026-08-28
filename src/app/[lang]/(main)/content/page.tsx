export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDictionary, localePath } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BackToCvLink } from "@/components/BackToCvLink";
import { ContentTabs } from "./ContentTabs";
import type { Profile, Experience, Education, Skill, Project, Other } from "./ContentTabs";

export const metadata: Metadata = { title: "My Content" };

type SearchParams = Promise<{ tab?: string; from?: string }>;

export default async function ContentPage({ searchParams }: { searchParams: SearchParams }) {
  const [session, query, { content }] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    searchParams,
    getDictionary(),
  ]);
  if (!session) redirect(await localePath("/sign-in?callbackUrl=/content"));

  const userId = session.user.id;

  // `from` names the CV the user stepped away from, so this page can offer a way
  // back. Scoped to the owner like every other read here — an id in the URL is
  // the user's to supply, and it must not become a way to read someone's CV name.
  const returnTo = query.from
    ? await prisma.cV.findFirst({
        where: { id: query.from, userId },
        select: { id: true, name: true },
      })
    : null;

  const [rawProfiles, experiences, educations, rawSkills, skillCategories, rawProjects, others, avatarDoc] =
    await Promise.all([
      prisma.profile.findMany({ where: { userId }, orderBy: { profileName: "asc" } }),
      prisma.experience.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.education.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.skill.findMany({ where: { userId }, orderBy: { name: "asc" } }),
      prisma.skillCategory.findMany({
        where: { userId },
        orderBy: [{ order: "asc" }, { name: "asc" }],
        select: { id: true, name: true, kind: true },
      }),
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
    nationality: p.nationality ?? undefined,
    dateOfBirth: p.dateOfBirth ? p.dateOfBirth.toISOString().slice(0, 10) : undefined,
    drivingLicense: p.drivingLicense ?? undefined,
    social: { linkedin: p.linkedin ?? undefined, github: p.github ?? undefined, website: p.website ?? undefined, portfolio: p.portfolio ?? undefined },
  }));

  const skills: Skill[] = rawSkills.map((s) => ({
    id: s.id,
    name: s.name,
    level: s.level ?? undefined,
    cefrLevel: s.cefrLevel ?? undefined,
  }));

  const projects: Project[] = rawProjects.map((p) => ({
    id: p.id,
    title: p.title,
    summary: p.summary ?? undefined,
    startDate: p.startDate ?? undefined,
    endDate: p.endDate ?? undefined,
    current: p.current,
    url: p.url ?? undefined,
    sourceUrl: p.sourceUrl ?? undefined,
    skills: p.skills,
    publishedAt: p.publishedAt?.toISOString() ?? undefined,
  }));

  return (
    <main className="min-h-screen pt-2 pb-12">
      {/* `max-w-5xl mx-auto px-6` is the page band — the same container the nav
          bar, the footer and the preview toolbar use — so the way back starts
          at the logo's left edge on every page that offers one. The reading
          column below is deliberately narrower and does NOT line up with it;
          putting this link in that column instead pushed it far to the right of
          every other top-level element.

          `py-3` matches the preview row. The heading block keeps the original
          top spacing when there is no CV to go back to. */}
      {returnTo && (
        <div className="max-w-5xl mx-auto px-6 py-3">
          <BackToCvLink cvId={returnTo.id} cvName={returnTo.name} className="max-w-full" />
        </div>
      )}
      {/* Wider than the `max-w-2xl` the marketing page and the list pages use.
          2xl is a reading measure, right for prose and for a column of cards —
          but this page is forms and pickers, where it was just a ceiling. */}
      <div className={`max-w-4xl mx-auto px-4 space-y-8 ${returnTo ? "pt-6" : "pt-12"}`}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-(--cl-text)">
            {content.title}
          </h1>
          <p className="text-sm text-(--cl-muted) mt-1">{content.subtitle}</p>
        </div>
        <ContentTabs
          initialTab={query.tab}
          returnToCvId={returnTo?.id}
          initialProfiles={profiles}
          initialExperiences={experiences as Experience[]}
          initialEducations={educations as Education[]}
          initialSkills={skills}
          skillCategories={skillCategories}
          initialProjects={projects}
          initialOthers={others as Other[]}
          initialAvatarImages={avatarDoc?.images ?? []}
        />
      </div>
    </main>
  );
}
