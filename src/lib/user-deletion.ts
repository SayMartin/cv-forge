import { prisma } from "@/lib/prisma";
import { blobDelete } from "@/lib/r2";

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
 * Call this *before* deleting the user. The `avatar` row is what names the files,
 * and it cascades away with the user — delete the user first and the URLs go
 * with it, leaving files that nothing points at. This throws if storage cleanup
 * fails, so the caller can abort instead.
 *
 * Files are removed by their stored URL rather than by listing the
 * `avatars/<userId>/` prefix. Listing is a bucket-level operation, and avoiding
 * it means the app's R2 token never needs more than object-level rights. The
 * cost is that only files the database knows about are removed, so an object
 * orphaned by some earlier bug would be missed. Nothing can orphan one now — the
 * object and its URL are written in the same request — which makes that a good
 * trade for an app that cannot delete its own buckets.
 *
 * Idempotent: safe to run against a user whose files are already gone.
 */
export async function purgeUserSideEffects(userId: string): Promise<void> {
  const avatar = await prisma.avatar.findUnique({
    where: { userId },
    select: { images: true },
  });

  // Sequential, and deliberately not best-effort: at most five files, and a
  // throw here leaves the account intact so the whole operation can be retried.
  for (const url of avatar?.images ?? []) {
    await blobDelete(url);
  }

  await prisma.verification.deleteMany({ where: { value: userId } });
}
