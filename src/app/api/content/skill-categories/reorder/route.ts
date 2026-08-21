import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PATCH /api/content/skill-categories/reorder
//
// Takes the full ordered list of the caller's category ids and rewrites `order` to
// match. Whole-list rather than per-item so the result can never be a partial
// ordering with duplicate or missing positions.
export async function PATCH(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const ids: unknown = body.ids;
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "ids must be an array of strings" }, { status: 400 });
  }

  const owned = await prisma.skillCategory.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });

  // Every id must be one of the caller's, and all of them must be present — a
  // short list would leave the omitted categories holding stale positions.
  const ownedIds = new Set(owned.map((c) => c.id));
  const unique = new Set(ids as string[]);
  if (unique.size !== ids.length || unique.size !== ownedIds.size) {
    return NextResponse.json({ error: "ids must list each category exactly once" }, { status: 400 });
  }
  if ((ids as string[]).some((id) => !ownedIds.has(id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.$transaction(
    (ids as string[]).map((id, order) =>
      prisma.skillCategory.update({ where: { id }, data: { order } }),
    ),
  );

  return NextResponse.json({ ok: true });
}
