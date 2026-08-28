import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// POST /api/content/projects
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return apiError("unauthorized", 401);

  const body = await req.json();
  const title = String(body.title ?? "").trim();
  if (!title) {
    return apiError("title_required", 400);
  }

  const doc = await prisma.project.create({
    data: {
      userId: session.user.id,
      title,
      slug: slugify(title),
      summary: body.summary || null,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      current: body.current === true,
      url: body.url || null,
      sourceUrl: body.sourceUrl || null,
      skills: Array.isArray(body.skills) ? body.skills.filter(Boolean) : [],
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
    },
  });

  return NextResponse.json({ id: doc.id });
}
