import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ cvId: string }> };

// GET /api/cvs/[cvId] — fetch one CV (owner only)
export async function GET(_req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cvId } = await params;
  const cv = await prisma.cV.findUnique({ where: { id: cvId } });

  if (!cv || cv.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(cv);
}

// PATCH /api/cvs/[cvId] — update name and/or selected entry IDs
export async function PATCH(request: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cvId } = await params;
  const existing = await prisma.cV.findUnique({ where: { id: cvId } });

  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  const updated = await prisma.cV.update({ where: { id: cvId }, data });
  return NextResponse.json(updated);
}

// DELETE /api/cvs/[cvId] — delete a CV (owner only)
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cvId } = await params;
  const existing = await prisma.cV.findUnique({ where: { id: cvId } });

  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.cV.delete({ where: { id: cvId } });
  return new NextResponse(null, { status: 204 });
}
