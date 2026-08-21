import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_SKILL_CATEGORIES } from "@/lib/cv-content-types";

export const dynamic = "force-dynamic";

// GET /api/content/skill-categories
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.skillCategory.findMany({
    where: { userId: session.user.id },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { id: true, name: true, kind: true, order: true },
  });

  return NextResponse.json({ categories });
}

// POST /api/content/skill-categories
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (name.length > 40) {
    return NextResponse.json({ error: "name is too long" }, { status: 400 });
  }

  const existing = await prisma.skillCategory.findMany({
    where: { userId: session.user.id },
    select: { name: true, order: true },
  });

  // Enforced here rather than in the schema: the cap is a layout constraint, and a
  // database-level one would make the backfilled rows of an older account invalid.
  if (existing.length >= MAX_SKILL_CATEGORIES) {
    return NextResponse.json(
      { error: `At most ${MAX_SKILL_CATEGORIES} categories` },
      { status: 409 },
    );
  }

  // Case-insensitive: the unique index is exact, so without this "backend" and
  // "Backend" would both be accepted and then render as two identical headings.
  if (existing.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    return NextResponse.json({ error: "That category already exists" }, { status: 409 });
  }

  const doc = await prisma.skillCategory.create({
    data: {
      userId: session.user.id,
      name,
      kind: "normal",
      order: existing.reduce((max, c) => Math.max(max, c.order), -1) + 1,
    },
  });

  return NextResponse.json({ id: doc.id });
}
