import { prisma } from "@/lib/prisma";
import { blobDeletePrefix } from "@/lib/r2";

/**
 * Remove the parts of a user's data that `prisma.user.delete()` does not reach.
 *
 * Every content model cascades from `user`, but two things sit outside it and
 * both are personal data:
 *
 * - **Avatar image files in R2.** The `avatar` row cascades; the files it points
 *   at do not. The bucket is public via a Custom Domain, so an uploaded face
 *   photo stays retrievable by anyone holding the URL long after the account is
 *   gone.
 * - **`verification` rows.** The model has no `userId` and no foreign key, so no
 *   cascade reaches it. Under Better Auth 1.7 email verification is stateless
 *   (a signed JWT, no row), and the only rows carrying a user id are
 *   password-reset ones, which store it in `value`.
 *
 * Call this *before* deleting the user, and let it throw rather than swallowing a
 * storage failure, so the caller can abort and leave the account intact for a
 * retry. Best-effort deletion is what left an orphaned photo in the bucket in the
 * first place.
 *
 * Files go by **prefix**, not by the URLs recorded in `avatar.images`, because the
 * database is not a complete record of what is in the bucket. `POST /api/avatars`
 * calls `blobPut` before `prisma.avatar.upsert`; if the upsert fails, the route
 * returns 500 with the object already stored and no row naming it. Deleting only
 * what the database knows about would leave exactly that file behind — and
 * erasure is the one place where "narrow but reachable" still counts.
 *
 * `ListObjectsV2` and `DeleteObjects` are both covered by an `Object Read & Write`
 * token, so this costs no extra permission.
 *
 * Idempotent: safe to run against a user whose files are already gone.
 */
export async function purgeUserSideEffects(userId: string): Promise<void> {
  await blobDeletePrefix(`avatars/${userId}/`);
  await prisma.verification.deleteMany({ where: { value: userId } });
}
