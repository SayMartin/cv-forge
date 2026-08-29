import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SECTION_ORDER } from "@/lib/cv-layouts";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ cvId: string }> };

// POST /api/cvs/[cvId]/duplicate — copy a CV and return the new one
//
// NOTE — pre-existing bug, deliberately not fixed here: this copies neither
// `chronological`, `targetRole`, `coverLetter` nor `skillGroups`, so a
// duplicated CV silently loses its timeline mode, its target role, its cover
// letter and its whole per-CV skills arrangement. `language` was added to the
// list when per-CV language shipped; the other four predate it and fixing them
// is a behaviour change that deserves its own commit and its own testing.
export async function POST(_req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return apiError("unauthorized", 401);

  const { cvId } = await params;
  const source = await prisma.cV.findUnique({ where: { id: cvId } });

  if (!source || source.userId !== session.user.id) {
    return apiError("not_found", 404);
  }

  const copy = await prisma.cV.create({
    data: {
      name: `Copy of ${source.name}`,
      userId: source.userId,
      layoutId: source.layoutId,
      themeId: source.themeId,
      profileId: source.profileId,
      avatarIndex: source.avatarIndex,
      experienceIds: source.experienceIds,
      educationIds: source.educationIds,
      skillIds: source.skillIds,
      projectIds: source.projectIds,
      otherIds: source.otherIds,
      sectionOrder: source.sectionOrder.length ? source.sectionOrder : DEFAULT_SECTION_ORDER,
      language: source.language,
    },
  });

  return NextResponse.json(copy, { status: 201 });
}
