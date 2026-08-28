import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PATCH /api/profiles/[id]
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return apiError("unauthorized", 401);

  const { id } = await params;
  const existing = await prisma.profile.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return apiError("not_found", 404);
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.profileName !== undefined) data.profileName = String(body.profileName).trim();
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.headline !== undefined) data.headline = body.headline || null;
  if (body.bio !== undefined) data.bio = body.bio || null;
  if (body.email !== undefined) data.email = body.email || null;
  if (body.phone !== undefined) data.phone = body.phone || null;
  if (body.location !== undefined) data.location = body.location || null;
  if (body.nationality !== undefined) data.nationality = body.nationality || null;
  if (body.dateOfBirth !== undefined) data.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
  if (body.drivingLicense !== undefined) data.drivingLicense = body.drivingLicense || null;
  if (body.social !== undefined) {
    data.linkedin = body.social.linkedin || null;
    data.github = body.social.github || null;
    data.website = body.social.website || null;
    data.portfolio = body.social.portfolio || null;
  }

  const updated = await prisma.profile.update({ where: { id }, data });
  return NextResponse.json({ id: updated.id });
}

// DELETE /api/profiles/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return apiError("unauthorized", 401);

  const { id } = await params;
  const existing = await prisma.profile.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return apiError("not_found", 404);
  }

  await prisma.profile.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
