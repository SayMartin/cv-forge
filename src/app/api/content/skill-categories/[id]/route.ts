import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PATCH /api/content/skill-categories/[id] — rename only.
//
// `kind` is deliberately not patchable: it is the contract the CEFR field and the
// Europass language table depend on, and letting a rename flip it would break both
// from a screen that looks like it only changes a label.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.skillCategory.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // The spoken-language category is fixed in both name and role: Europass depends
  // on it always being present and identifiable, and it cannot be recreated from
  // the UI once changed, since `kind` is not settable when creating a category.
  if (existing.kind === "language") {
    return NextResponse.json(
      { error: "The language category cannot be renamed" },
      { status: 409 },
    );
  }

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (name.length > 40) {
    return NextResponse.json({ error: "name is too long" }, { status: 400 });
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
    return NextResponse.json({ error: "That category already exists" }, { status: 409 });
  }

  const updated = await prisma.skillCategory.update({ where: { id }, data: { name } });
  return NextResponse.json({ id: updated.id });
}

// DELETE /api/content/skill-categories/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.skillCategory.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // The spoken-language category is structural, not user content. Deleting it
  // would be irreversible from the UI — `kind` cannot be set when creating a
  // category, so every replacement would be "normal" — and it would permanently
  // remove the CEFR field and the Europass language table, which that format
  // requires. It can still be renamed; only the role is fixed.
  if (existing.kind === "language") {
    return NextResponse.json(
      { error: "The language category cannot be deleted — rename it instead" },
      { status: 409 },
    );
  }

  // The FK is SET NULL, so deleting a populated category would silently
  // uncategorise its skills — a change the user would only discover in an exported
  // CV. Refuse instead, and let them move the skills first.
  const inUse = await prisma.skill.count({ where: { categoryId: id } });
  if (inUse > 0) {
    return NextResponse.json(
      { error: `Category still holds ${inUse} skill${inUse === 1 ? "" : "s"}` },
      { status: 409 },
    );
  }

  await prisma.skillCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
