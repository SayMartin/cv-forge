import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/content/skills
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  // No category here by design: which group a skill belongs to is a per-CV
  // decision, stored in `cv.skillGroups`. The library holds the skill itself.
  const doc = await prisma.skill.create({
    data: {
      userId: session.user.id,
      name,
      level: body.level ? Number(body.level) : null,
      cefrLevel: body.cefrLevel || null,
      order: body.order ? Number(body.order) : 0,
    },
  });

  return NextResponse.json({ id: doc.id });
}
