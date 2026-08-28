import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { CvSkillGroup } from "@/lib/cv-content-types";

export const dynamic = "force-dynamic";

// PATCH /api/content/skills/[id]
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return apiError("unauthorized", 401);

  const { id } = await params;
  const existing = await prisma.skill.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return apiError("not_found", 404);
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.level !== undefined) data.level = body.level ? Number(body.level) : null;
  if (body.cefrLevel !== undefined) data.cefrLevel = body.cefrLevel || null;

  const updated = await prisma.skill.update({ where: { id }, data });
  return NextResponse.json({ id: updated.id });
}

// DELETE /api/content/skills/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return apiError("unauthorized", 401);

  const { id } = await params;
  const existing = await prisma.skill.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return apiError("not_found", 404);
  }

  // Nothing links a CV to a skill at the database level — `cv.skillIds` is a
  // scalar array and `cv.skillGroups` is JSON — so no cascade reaches them and a
  // deleted skill would leave its id behind in every CV that used it. Rendering
  // survives that (both the view page and the editor resolve ids through a map
  // and drop misses), but the leftovers accumulate, and one of them is not inert:
  // an id sitting in a group still counts as "placed", so a later skill reusing
  // that id would silently reappear inside someone's CV.
  //
  // A user has a handful of CVs, so reading them all and rewriting the affected
  // ones is cheaper than it looks, and it keeps the whole delete in one
  // transaction — the skill never disappears while references to it remain.
  const cvs = await prisma.cV.findMany({
    where: { userId: session.user.id },
    select: { id: true, skillIds: true, skillGroups: true },
  });

  const cleanups = cvs.flatMap((cv) => {
    const skillIds = cv.skillIds.filter((s) => s !== id);
    const groups = (cv.skillGroups as CvSkillGroup[] | null) ?? null;
    const nextGroups = groups?.map((g) => ({
      ...g,
      skillIds: (g.skillIds ?? []).filter((s) => s !== id),
    }));

    const groupsChanged =
      groups !== null && JSON.stringify(groups) !== JSON.stringify(nextGroups);
    if (skillIds.length === cv.skillIds.length && !groupsChanged) return [];

    return [
      prisma.cV.update({
        where: { id: cv.id },
        data: { skillIds, ...(groupsChanged ? { skillGroups: nextGroups } : {}) },
      }),
    ];
  });

  await prisma.$transaction([...cleanups, prisma.skill.delete({ where: { id } })]);
  return NextResponse.json({ ok: true });
}
