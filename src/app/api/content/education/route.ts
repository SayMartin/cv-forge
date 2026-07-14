import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/content/education
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const institution = String(body.institution ?? "").trim();
  if (!institution) {
    return NextResponse.json({ error: "institution is required" }, { status: 400 });
  }

  const doc = await prisma.education.create({
    data: {
      userId: session.user.id,
      institution,
      degree: body.degree || null,
      field: body.field || null,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      current: body.current === true,
      description: body.description || null,
    },
  });

  return NextResponse.json({ id: doc.id });
}
