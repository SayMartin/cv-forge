import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_CATEGORY_NAME } from "@/lib/cv-content-types";

export const dynamic = "force-dynamic";

// PATCH /api/content/skill-categories/[id] — rename only.
//
// `kind` is deliberately not patchable: it is the contract the CEFR field and the
// Europass language table depend on, and letting a rename flip it would break both
// from a screen that looks like it only changes a label.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return apiError("unauthorized", 401);

  const { id } = await params;
  const existing = await prisma.skillCategory.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return apiError("not_found", 404);
  }

  // The spoken-language category is fixed in both name and role: Europass depends
  // on it always being present and identifiable, and it cannot be recreated from
  // the UI once changed, since `kind` is not settable when creating a category.
  if (existing.kind === "language") {
    return apiError("language_category_rename", 409);
  }

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) {
    return apiError("name_required", 400);
  }
  if (name.length > MAX_CATEGORY_NAME) {
    return apiError("name_too_long", 400, { max: MAX_CATEGORY_NAME });
  }

  const clash = await prisma.skillCategory.findFirst({
    where: {
      userId: session.user.id,
      id: { not: id },
      name: { equals: name, mode: "insensitive" },
    },
    select: { id: true },
  });
  if (clash) {
    return apiError("category_exists", 409);
  }

  const updated = await prisma.skillCategory.update({ where: { id }, data: { name } });
  return NextResponse.json({ id: updated.id });
}

// DELETE /api/content/skill-categories/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return apiError("unauthorized", 401);

  const { id } = await params;
  const existing = await prisma.skillCategory.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return apiError("not_found", 404);
  }

  // The spoken-language category is structural, not user content. Deleting it
  // would be irreversible from the UI — `kind` cannot be set when creating a
  // category, so every replacement would be "normal" — and it would permanently
  // remove the CEFR field and the Europass language table, which that format
  // requires. It can still be renamed; only the role is fixed.
  if (existing.kind === "language") {
    return apiError("language_category_delete", 409);
  }

  // "In use" now means "some CV lays skills out under it" — skills themselves no
  // longer belong to a category. Deleting one that a CV references would silently
  // drop a whole group from that CV's skills section, which the user would only
  // discover in an exported PDF.
  const cvs = await prisma.cV.findMany({
    where: { userId: session.user.id },
    select: { name: true, skillGroups: true },
  });

  const usedBy = cvs
    .filter((cv) => {
      const groups = Array.isArray(cv.skillGroups) ? cv.skillGroups : [];
      return groups.some(
        (g) => g !== null && typeof g === "object" && !Array.isArray(g) &&
          (g as { categoryId?: unknown }).categoryId === id,
      );
    })
    .map((cv) => cv.name);

  if (usedBy.length > 0) {
    return apiError("category_in_use", 409, { count: usedBy.length, names: usedBy.join(", ") });
  }

  await prisma.skillCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
