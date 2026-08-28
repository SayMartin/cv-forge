import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ themeId: string }> };

// PATCH /api/themes/[themeId] — rename or recolor a theme
export async function PATCH(request: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return apiError("unauthorized", 401);

  const { themeId } = await params;
  const existing = await prisma.cvTheme.findUnique({ where: { id: themeId } });

  if (!existing || existing.userId !== session.user.id) {
    return apiError("not_found", 404);
  }

  const body = await request.json();
  const data: { name?: string; sidebarColor?: string; accentColor?: string } =
    {};

  if (typeof body.name === "string" && body.name.trim()) {
    data.name = body.name.trim();
  }
  if (
    typeof body.sidebarColor === "string" &&
    /^#[0-9a-fA-F]{6}$/.test(body.sidebarColor)
  ) {
    data.sidebarColor = body.sidebarColor;
  }
  if (
    typeof body.accentColor === "string" &&
    /^#[0-9a-fA-F]{6}$/.test(body.accentColor)
  ) {
    data.accentColor = body.accentColor;
  }

  const updated = await prisma.cvTheme.update({ where: { id: themeId }, data });
  return NextResponse.json(updated);
}

// DELETE /api/themes/[themeId] — delete a theme (CVs using it lose their themeId via SetNull)
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return apiError("unauthorized", 401);

  const { themeId } = await params;
  const existing = await prisma.cvTheme.findUnique({ where: { id: themeId } });

  if (!existing || existing.userId !== session.user.id) {
    return apiError("not_found", 404);
  }

  await prisma.cvTheme.delete({ where: { id: themeId } });
  return new NextResponse(null, { status: 204 });
}
