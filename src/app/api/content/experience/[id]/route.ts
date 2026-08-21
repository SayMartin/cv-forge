import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PATCH /api/content/experience/[id]
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.experience.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.company !== undefined) data.company = String(body.company).trim();
  if (body.role !== undefined) data.role = String(body.role).trim();
  if (body.startDate !== undefined) data.startDate = body.startDate || null;
  if (body.endDate !== undefined) data.endDate = body.endDate || null;
  if (body.current !== undefined) data.current = body.current === true;
  if (body.description !== undefined) data.description = body.description || null;
  if (body.url !== undefined) data.url = body.url || null;
  if (body.skills !== undefined) data.skills = Array.isArray(body.skills) ? body.skills.filter(Boolean) : [];

  const updated = await prisma.experience.update({ where: { id }, data });
  return NextResponse.json({ id: updated.id });
}

// DELETE /api/content/experience/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.experience.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.experience.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
