import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/themes — list all themes belonging to the current user
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const themes = await prisma.cvTheme.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(themes);
}

// POST /api/themes — create a new theme
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name)
    return NextResponse.json({ error: "name is required" }, { status: 400 });

  const sidebarColor =
    typeof body.sidebarColor === "string" &&
    /^#[0-9a-fA-F]{6}$/.test(body.sidebarColor)
      ? body.sidebarColor
      : "#2d2d2d";

  const accentColor =
    typeof body.accentColor === "string" &&
    /^#[0-9a-fA-F]{6}$/.test(body.accentColor)
      ? body.accentColor
      : "#c9a84c";

  const theme = await prisma.cvTheme.create({
    data: { userId: session.user.id, name, sidebarColor, accentColor },
  });

  return NextResponse.json(theme, { status: 201 });
}
