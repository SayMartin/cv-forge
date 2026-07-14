import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PATCH /api/content/education/[id]
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.education.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.institution !== undefined) data.institution = String(body.institution).trim();
  if (body.degree !== undefined) data.degree = body.degree || null;
  if (body.field !== undefined) data.field = body.field || null;
  if (body.startDate !== undefined) data.startDate = body.startDate || null;
  if (body.endDate !== undefined) data.endDate = body.endDate || null;
  if (body.current !== undefined) data.current = body.current === true;
  if (body.description !== undefined) data.description = body.description || null;

  const updated = await prisma.education.update({ where: { id }, data });
  return NextResponse.json({ id: updated.id });
}

// DELETE /api/content/education/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.education.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.education.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
