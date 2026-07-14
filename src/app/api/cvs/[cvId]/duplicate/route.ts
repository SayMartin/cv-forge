import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SECTION_ORDER } from "@/lib/cv-layouts";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ cvId: string }> };

// POST /api/cvs/[cvId]/duplicate — copy a CV and return the new one
export async function POST(_req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cvId } = await params;
  const source = await prisma.cV.findUnique({ where: { id: cvId } });

  if (!source || source.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
    },
  });

  return NextResponse.json(copy, { status: 201 });
}
