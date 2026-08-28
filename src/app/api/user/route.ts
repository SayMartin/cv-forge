import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { purgeUserSideEffects } from "@/lib/user-deletion";
import { safeError } from "@/lib/log";

export const dynamic = "force-dynamic";

// DELETE /api/user — permanently delete the authenticated user and all their data
export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return apiError("unauthorized", 401);
  }

  // Admins cannot delete their own account via the app
  if (session.user.role === "admin") {
    return apiError("admin_undeletable", 403);
  }

  // Avatar files in R2 and verification rows sit outside the cascade, and the
  // user id is what finds them — so they go first. Failing hard rather than
  // best-effort is deliberate: swallowing this error is what left a deleted
  // user's face photo publicly retrievable in the bucket.
  try {
    await purgeUserSideEffects(session.user.id);
  } catch (err) {
    console.error("[user] side-effect purge failed:", safeError(err));
    return apiError("account_delete_failed", 502);
  }

  // All content models have onDelete: Cascade — deleting the user row is sufficient
  await prisma.user.delete({ where: { id: session.user.id } });

  return new NextResponse(null, { status: 204 });
}
