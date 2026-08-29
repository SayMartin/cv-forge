import { LOCALE_COOKIE } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import { seedCategories, seedKind } from "@/lib/skill-category-seed";

/**
 * Gives a new account the default set of skill categories, in the language the
 * person signing up is actually using.
 *
 * Called from the Better Auth `user.create.after` database hook so it covers
 * every sign-up path — email/password and Google alike — rather than only the
 * paths that happen to go through the sign-up page.
 *
 * `skipDuplicates` makes this safe to call more than once: re-running it on an
 * account that already has categories is a no-op rather than an error.
 */
export async function seedSkillCategories(
  userId: string,
  locale: string | null | undefined,
): Promise<void> {
  await prisma.skillCategory.createMany({
    data: seedCategories(locale).map(({ key, name, order }) => ({
      userId,
      name,
      kind: seedKind(key),
      order,
    })),
    skipDuplicates: true,
  });
}

/**
 * Which language to seed in — and it takes two tries, because the two sign-up
 * paths know different things.
 *
 * 1. **`user.locale`.** The sign-up form passes it in the same call that creates
 *    the row (`input: true`), so the email/password path has a deliberate choice
 *    to honour.
 * 2. **The `cvforge_locale` cookie on the creating request.** Google OAuth never
 *    touches the sign-up form, so nothing writes `user.locale` there and step 1
 *    is always NULL — but the callback still arrives from the browser that has
 *    been reading `/sv`, carrying the cookie `proxy.ts` set. Without this, every
 *    Swedish account created with Google would start with English categories and
 *    the user would have to rename all eight.
 * 3. Neither — English, via `seedCategories`' own fallback.
 *
 * Parsed by hand rather than with `cookies()`: this runs inside a Better Auth
 * endpoint, not a Server Component, and `request` is what the hook is handed.
 */
export function signUpLocale(
  userLocale: string | null | undefined,
  request: Request | undefined,
): string | undefined {
  if (userLocale) return userLocale;

  const cookie = request?.headers.get("cookie");
  if (!cookie) return undefined;

  for (const part of cookie.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === LOCALE_COOKIE) return decodeURIComponent(value.join("="));
  }
  return undefined;
}
