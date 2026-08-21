import { prisma } from "@/lib/prisma";
import { LANGUAGE_CATEGORY_NAME, SKILL_CATEGORIES } from "@/lib/cv-content-types";

/**
 * Gives a new account the default set of skill categories.
 *
 * Called from the Better Auth `user.create.after` database hook so it covers every
 * sign-up path — email/password and Google alike — rather than only the paths that
 * happen to go through the sign-up page.
 *
 * `skipDuplicates` makes this safe to call more than once: re-running it on an
 * account that already has categories is a no-op rather than an error.
 */
export async function seedSkillCategories(userId: string): Promise<void> {
  await prisma.skillCategory.createMany({
    data: SKILL_CATEGORIES.map((name, order) => ({
      userId,
      name,
      kind: name === LANGUAGE_CATEGORY_NAME ? "language" : "normal",
      order,
    })),
    skipDuplicates: true,
  });
}

/**
 * Resolves a client-supplied skill category id against the caller's own categories.
 *
 * Same class of check as the `profileId` guard on CV PATCH: the id arrives in a
 * request body, so without verifying ownership a user could file a skill under —
 * and then render — another user's category. `categoryId` is nullable by design;
 * an uncategorised skill is a valid state, so an empty value is accepted rather
 * than rejected.
 *
 * Returns `{ ok: false }` for an id that is neither empty nor owned by the user,
 * letting the caller answer 400 instead of silently dropping the value.
 */
export async function resolveCategoryId(
  raw: unknown,
  userId: string,
): Promise<{ ok: true; categoryId: string | null } | { ok: false }> {
  if (raw == null || raw === "") return { ok: true, categoryId: null };
  if (typeof raw !== "string") return { ok: false };

  const category = await prisma.skillCategory.findFirst({
    where: { id: raw, userId },
    select: { id: true },
  });

  return category ? { ok: true, categoryId: category.id } : { ok: false };
}
