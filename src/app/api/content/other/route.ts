import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/content/other
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const doc = await prisma.other.create({
    data: {
      userId: session.user.id,
      title,
      subtitle: body.subtitle || null,
      date: body.date || null,
      description: body.description || null,
      url: body.url || null,
      order: body.order ? Number(body.order) : 0,
    },
  });

  return NextResponse.json({ id: doc.id });
}
