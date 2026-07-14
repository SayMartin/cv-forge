import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SECTION_ORDER } from "@/lib/cv-layouts";

export const dynamic = "force-dynamic";

// GET /api/cvs — list all CVs for the logged-in user
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cvs = await prisma.cV.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json(cvs);
}

// POST /api/cvs — create a new CV
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const cv = await prisma.cV.create({
    data: {
      name: name.trim(),
      userId: session.user.id,
      experienceIds: [],
      educationIds: [],
      skillIds: [],
      projectIds: [],
      sectionOrder: DEFAULT_SECTION_ORDER,
    },
  });

  return NextResponse.json(cv, { status: 201 });
}
