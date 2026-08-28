import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { CvSkillGroup } from "@/lib/cv-content-types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ cvId: string }> };

// GET /api/cvs/[cvId] — fetch one CV (owner only)
export async function GET(_req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return apiError("unauthorized", 401);

  const { cvId } = await params;
  const cv = await prisma.cV.findUnique({ where: { id: cvId } });

  if (!cv || cv.userId !== session.user.id) {
    return apiError("not_found", 404);
  }

  return NextResponse.json(cv);
}

// PATCH /api/cvs/[cvId] — update name and/or selected entry IDs
export async function PATCH(request: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return apiError("unauthorized", 401);

  const { cvId } = await params;
  const existing = await prisma.cV.findUnique({ where: { id: cvId } });

  if (!existing || existing.userId !== session.user.id) {
    return apiError("not_found", 404);
  }

  const body = await request.json();

  // Only allow known fields to be patched
  const data: {
    name?: string;
    layoutId?: string;
    themeId?: string | null;
    profileId?: string | null;
    avatarIndex?: number | null;
    experienceIds?: string[];
    educationIds?: string[];
    skillIds?: string[];
    projectIds?: string[];
    otherIds?: string[];
    targetRole?: string | null;
    coverLetter?: string | null;
    sectionOrder?: string[];
    chronological?: boolean;
    skillGroups?: CvSkillGroup[];
  } = {};

  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.layoutId !== undefined) data.layoutId = String(body.layoutId);
  if (body.themeId !== undefined) data.themeId = body.themeId ?? null;
  if (body.profileId !== undefined) data.profileId = body.profileId ?? null;
  if (body.avatarIndex !== undefined) data.avatarIndex = body.avatarIndex ?? null;
  if (Array.isArray(body.experienceIds)) data.experienceIds = body.experienceIds;
  if (Array.isArray(body.educationIds)) data.educationIds = body.educationIds;
  if (Array.isArray(body.skillIds)) data.skillIds = body.skillIds;
  if (Array.isArray(body.projectIds)) data.projectIds = body.projectIds;
  if (Array.isArray(body.otherIds)) data.otherIds = body.otherIds;
  if (body.targetRole !== undefined) data.targetRole = body.targetRole ?? null;
  if (body.coverLetter !== undefined) data.coverLetter = body.coverLetter ?? null;
  if (Array.isArray(body.sectionOrder)) data.sectionOrder = body.sectionOrder;
  if (typeof body.chronological === "boolean") data.chronological = body.chronological;

  // skillGroups carries the whole per-CV skills arrangement, so it is validated
  // rather than trusted: unknown category ids would render as empty headings, and
  // foreign skill ids would be silently dropped by the view page's userId filter —
  // both failures that only show up in an exported PDF.
  if (Array.isArray(body.skillGroups)) {
    const [ownedCategories, ownedSkills] = await Promise.all([
      prisma.skillCategory.findMany({ where: { userId: session.user.id }, select: { id: true } }),
      prisma.skill.findMany({ where: { userId: session.user.id }, select: { id: true } }),
    ]);
    const categoryIds = new Set(ownedCategories.map((c) => c.id));
    const skillIds = new Set(ownedSkills.map((s) => s.id));

    const seenCategories = new Set<string>();
    const seenSkills = new Set<string>();
    const groups: CvSkillGroup[] = [];

    for (const raw of body.skillGroups) {
      if (!raw || typeof raw !== "object") continue;
      const categoryId = String(raw.categoryId ?? "");
      // A category may appear once: twice would give two identical headings, and
      // the same skill may sit in only one group.
      if (!categoryIds.has(categoryId) || seenCategories.has(categoryId)) continue;
      seenCategories.add(categoryId);

      const ids = Array.isArray(raw.skillIds) ? raw.skillIds : [];
      const groupSkills: string[] = [];
      for (const id of ids) {
        const skillId = String(id);
        if (!skillIds.has(skillId) || seenSkills.has(skillId)) continue;
        seenSkills.add(skillId);
        groupSkills.push(skillId);
      }

      groups.push({
        categoryId,
        ...(raw.hidden === true ? { hidden: true } : {}),
        skillIds: groupSkills,
      });
    }

    data.skillGroups = groups;
  }

  // The invariant: a skill can only be selected if it is placed in a group. Applied
  // against whichever groups this request results in — the incoming ones, or the
  // stored ones when only the selection is being patched.
  if (data.skillIds || data.skillGroups) {
    const groups = data.skillGroups ?? (existing.skillGroups as CvSkillGroup[] | null) ?? [];
    const placed = new Set(groups.flatMap((g) => g.skillIds ?? []));
    const selection = data.skillIds ?? existing.skillIds;
    data.skillIds = selection.filter((id) => placed.has(id));
  }

  // profileId and themeId are patched straight from the request body. profileId has
  // no FK at all, so without this guard any cuid is accepted and the view page would
  // later resolve and render another user's profile (name, phone, dateOfBirth, …).
  // The *Ids arrays need no guard: the view page re-filters each findMany by userId.
  if (data.profileId) {
    const profile = await prisma.profile.findFirst({
      where: { id: data.profileId, userId: session.user.id },
      select: { id: true },
    });
    if (!profile) return apiError("not_found", 404);
  }

  if (data.themeId) {
    const theme = await prisma.cvTheme.findFirst({
      where: { id: data.themeId, userId: session.user.id },
      select: { id: true },
    });
    if (!theme) return apiError("not_found", 404);
  }

  const updated = await prisma.cV.update({ where: { id: cvId }, data });
  return NextResponse.json(updated);
}

// DELETE /api/cvs/[cvId] — delete a CV (owner only)
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return apiError("unauthorized", 401);

  const { cvId } = await params;
  const existing = await prisma.cV.findUnique({ where: { id: cvId } });

  if (!existing || existing.userId !== session.user.id) {
    return apiError("not_found", 404);
  }

  await prisma.cV.delete({ where: { id: cvId } });
  return new NextResponse(null, { status: 204 });
}
