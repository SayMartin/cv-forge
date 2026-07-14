import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// DELETE /api/user — permanently delete the authenticated user and all their data
export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Admins cannot delete their own account via the app
  if (session.user.role === "admin") {
    return NextResponse.json(
      { error: "Admin accounts cannot be deleted from the application." },
      { status: 403 },
    );
  }

  // All content models have onDelete: Cascade — deleting the user row is sufficient
  await prisma.user.delete({ where: { id: session.user.id } });

  return new NextResponse(null, { status: 204 });
}
