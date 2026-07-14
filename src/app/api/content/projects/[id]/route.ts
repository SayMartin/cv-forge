import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// PATCH /api/content/projects/[id]
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) {
    data.title = String(body.title).trim();
    data.slug = slugify(String(body.title).trim());
  }
  if (body.summary !== undefined) data.summary = body.summary || null;
  if (body.url !== undefined) data.url = body.url || null;
  if (body.sourceUrl !== undefined) data.sourceUrl = body.sourceUrl || null;
  if (body.skills !== undefined) data.skills = Array.isArray(body.skills) ? body.skills.filter(Boolean) : [];
  if (body.publishedAt !== undefined) data.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;

  const updated = await prisma.project.update({ where: { id }, data });
  return NextResponse.json({ id: updated.id });
}

// DELETE /api/content/projects/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
