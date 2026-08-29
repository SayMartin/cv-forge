import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SECTION_ORDER } from "@/lib/cv-layouts";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

// GET /api/cvs — list all CVs for the logged-in user
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return apiError("unauthorized", 401);

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
  if (!session) return apiError("unauthorized", 401);

  const { name, language } = await request.json();
  if (!name?.trim()) {
    return apiError("cv_name_required", 400);
  }

  // A new CV starts in the language of the page the user created it from, which
  // the *client* sends: this is a Route Handler, so `next/root-params` is not
  // available and the request itself carries no locale. Validated rather than
  // trusted — the body is `any` and the column feeds every heading on the page.
  const cvLanguage = isLocale(language) ? language : DEFAULT_LOCALE;

  const cv = await prisma.cV.create({
    data: {
      name: name.trim(),
      userId: session.user.id,
      experienceIds: [],
      educationIds: [],
      skillIds: [],
      projectIds: [],
      sectionOrder: DEFAULT_SECTION_ORDER,
      language: cvLanguage,
    },
  });

  return NextResponse.json(cv, { status: 201 });
}
