import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_SKILL_CATEGORIES, MAX_CATEGORY_NAME } from "@/lib/cv-content-types";

export const dynamic = "force-dynamic";

// GET /api/content/skill-categories
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return apiError("unauthorized", 401);

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
  if (!session) return apiError("unauthorized", 401);

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) {
    return apiError("name_required", 400);
  }
  if (name.length > MAX_CATEGORY_NAME) {
    return apiError("name_too_long", 400, { max: MAX_CATEGORY_NAME });
  }

  const existing = await prisma.skillCategory.findMany({
    where: { userId: session.user.id },
    select: { name: true, order: true },
  });

  // Enforced here rather than in the schema: the cap is a layout constraint, and a
  // database-level one would make the backfilled rows of an older account invalid.
  if (existing.length >= MAX_SKILL_CATEGORIES) {
    return apiError("category_limit", 409, { count: MAX_SKILL_CATEGORIES });
  }

  // Case-insensitive: the unique index is exact, so without this "backend" and
  // "Backend" would both be accepted and then render as two identical headings.
  if (existing.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    return apiError("category_exists", 409);
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
