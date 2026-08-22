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
 * Call this *before* deleting the user. Once the row is gone so is the id, and
 * the files can never be located again — the failure becomes permanent. This
 * throws if storage cleanup fails so the caller can abort instead.
 *
 * Idempotent: safe to run against a user whose files are already gone.
 */
export async function purgeUserSideEffects(userId: string): Promise<void> {
  // R2 first: it is the half that cannot be retried once the id is lost.
  await blobDeletePrefix(`avatars/${userId}/`);
  await prisma.verification.deleteMany({ where: { value: userId } });
}
