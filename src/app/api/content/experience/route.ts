import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/content/experience
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return apiError("unauthorized", 401);

  const body = await req.json();
  const company = String(body.company ?? "").trim();
  const role = String(body.role ?? "").trim();
  if (!company || !role) {
    return apiError("experience_required", 400);
  }

  const doc = await prisma.experience.create({
    data: {
      userId: session.user.id,
      company,
      role,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      current: body.current === true,
      description: body.description || null,
      url: body.url || null,
      skills: Array.isArray(body.skills) ? body.skills.filter(Boolean) : [],
    },
  });

  return NextResponse.json({ id: doc.id });
}
