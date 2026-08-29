import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";
import { safeError } from "@/lib/log";
import { seedSkillCategories, signUpLocale } from "@/lib/skill-categories";
import { purgeUserSideEffects } from "@/lib/user-deletion";
import { sendAuthEmail } from "@/lib/email";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    process.env.BETTER_AUTH_URL,
    "http://localhost:3000",
    "http://localhost:3001",
  ].filter((origin): origin is string => Boolean(origin)),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    /**
     * `user` is the raw row Better Auth read from Postgres, so `locale` is on it
     * — but only because it is declared in `additionalFields` below. The
     * hand-written parameter type is what makes that visible here; Better Auth's
     * own inferred type would carry it too, and spelling it out keeps the
     * dependency from being invisible if the declaration is ever removed.
     */
    sendResetPassword: async ({
      user,
      url,
    }: {
      user: { name: string; email: string; locale?: string | null };
      url: string;
    }) => {
      // Swallowed on purpose, and not only out of caution. Better Auth runs this
      // through `runInBackgroundOrAwait`, which catches anyway — and the reset
      // endpoint answers identically whether or not the address exists, so a
      // failure that changed the response would be the tell that it does.
      try {
        await sendAuthEmail("resetPasswordEmail", user, url);
      } catch (error) {
        console.error("[auth] password reset email failed:", safeError(error));
      }
    },
  },
  emailVerification: {
    sendOnSignUp: false,
    /**
     * Left to throw, unlike the reset above. `sign-up/page.tsx` calls
     * `POST /api/auth/send-verification-email` explicitly for this reason: that
     * endpoint rethrows to the caller, so a Resend failure becomes a real
     * message on the sign-up form instead of a false "check your email".
     */
    sendVerificationEmail: async ({
      user,
      url,
    }: {
      user: { name: string; email: string; locale?: string | null };
      url: string;
    }) => {
      await sendAuthEmail("verificationEmail", user, url);
    },
  },
  /**
   * **A Prisma column Better Auth has not been told about does not exist.**
   *
   * `getFields()` composes the user schema from the core fields, these
   * `additionalFields`, and the plugin fields; `filterOutputFields` then strips
   * everything else on the way out. Add the column to `schema.prisma` and stop
   * here, and `session.user.locale` is `undefined` everywhere — no error, no
   * warning, and neither `tsc` nor `eslint` notices. Every feature built on it
   * silently does nothing.
   *
   * `input: true` lets the sign-up form pass `locale` in the same call that
   * creates the row, which is what puts the *first* verification email in the
   * right language. It also means the value is client-supplied, so it is never
   * trusted: every read runs through `isLocale()` and falls back rather than
   * being used as-is.
   *
   * No `defaultValue` — see the schema comment. NULL means "never chose", which
   * is not the same as choosing English.
   */
  user: {
    additionalFields: {
      locale: { type: "string", required: false, input: true },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Every account starts with a usable set of skill categories. Placed here
        // rather than in the sign-up page so Google sign-in — which creates an
        // account without ever touching that page — is covered too.
        //
        // The second argument is the endpoint context, which is where the
        // Google path's language has to come from: it never touches the sign-up
        // form, so `user.locale` is NULL there and only the request's cookie
        // knows. See `signUpLocale`.
        after: async (user, context) => {
          try {
            // `user.locale` is typed `unknown` here: the hook's user type is
            // built from the core fields plus a `[key: string]: unknown` index
            // for `additionalFields`, so the declaration below does not narrow
            // it. `signUpLocale` takes the raw value and every downstream read
            // validates through `isLocale()`, so the assertion widens nothing
            // that was not already going to be checked.
            const locale = signUpLocale(
              user.locale as string | null | undefined,
              context?.request,
            );
            await seedSkillCategories(user.id, locale);
          } catch (error) {
            // Never fail account creation over this: an empty category list is a
            // recoverable state, a half-created account is not.
            console.error("[auth] skill category seeding failed:", safeError(error));
          }
        },
      },
      delete: {
        // The app's own delete path is DELETE /api/user, which calls this
        // directly and never reaches Better Auth. This hook covers the other
        // door: the admin() plugin exposes /api/auth/admin/remove-user, which
        // goes through Better Auth's deleteUser and would otherwise skip the
        // cleanup entirely. purgeUserSideEffects is idempotent, so a path that
        // somehow ran both is harmless.
        //
        // Returning false aborts the delete — the opposite of the create hook
        // above, and for the opposite reason: here a half-finished delete is
        // the unrecoverable state, since losing the id loses the files.
        before: async (user) => {
          try {
            await purgeUserSideEffects(user.id);
          } catch (error) {
            console.error("[auth] user side-effect purge failed:", safeError(error));
            return false;
          }
        },
      },
    },
  },
  plugins: [admin()],
});

export type Auth = typeof auth;
