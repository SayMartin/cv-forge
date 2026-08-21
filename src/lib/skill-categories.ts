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

