import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";
import { safeError } from "@/lib/log";
import { seedSkillCategories } from "@/lib/skill-categories";
import { purgeUserSideEffects } from "@/lib/user-deletion";
import { Resend } from "resend";

const EMAIL_FROM = process.env.EMAIL_FROM ?? "CV Forge <noreply@appfinningar.se>";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Outside production, print the link rather than sending it.
 *
 * `.env.local` carries live Resend credentials, so without this every test
 * sign-up delivers a real message from the production sender and spends its
 * reputation on throwaway accounts. Database and storage are separated per
 * environment; this is the last dependency that was not.
 *
 * Returns true when it handled the link, so callers can bail out early.
 */
function printLinkInDevelopment(kind: string, email: string, url: string): boolean {
  if (IS_PRODUCTION) return false;
  console.log(`\n[auth] ${kind} for ${email} — development, no email sent:\n       ${url}\n`);
  return true;
}

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
    sendResetPassword: async ({ user, url }: { user: { name: string; email: string }; url: string }) => {
      if (printLinkInDevelopment("Password reset link", user.email, url)) return;

      if (!process.env.RESEND_API_KEY) {
        console.error("[auth] RESEND_API_KEY is not set");
        return;
      }
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email,
        subject: "Reset your CV Forge password",
        html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e0;">

        <tr><td style="background:#2d5a27;padding:32px 40px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:1px;">CV Forge</p>
        </td></tr>

        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 16px;font-size:18px;color:#1a1a1a;">Hi ${user.name},</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#444;">
            We received a request to reset the password for your CV Forge account. Click the button below to choose a new password.
          </p>
          <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#444;">
            This link is valid for <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your password will not change.
          </p>

          <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
            <tr><td style="background:#2d5a27;border-radius:8px;">
              <a href="${url}" style="display:block;padding:14px 32px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                Reset my password
              </a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:13px;line-height:1.6;color:#888;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${url}" style="color:#2d5a27;word-break:break-all;">${url}</a>
          </p>
        </td></tr>

        <tr><td style="background:#f9f9f7;border-top:1px solid #e5e5e0;padding:20px 40px;">
          <p style="margin:0;font-size:12px;color:#aaa;line-height:1.6;">
            You received this because a password reset was requested for the CV Forge account associated with this address.
            If that wasn't you, no action is needed.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
      });
      if (error) {
        console.error("[auth] Resend error (reset password):", safeError(error));
      }
    },
  },
  emailVerification: {
    sendOnSignUp: false,
    sendVerificationEmail: async ({ user, url }: { user: { name: string; email: string }; url: string }) => {
      if (printLinkInDevelopment("Verification link", user.email, url)) return;

      if (!process.env.RESEND_API_KEY) {
        console.error("[auth] RESEND_API_KEY is not set");
        throw new Error("Email service is not configured");
      }
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: user.email,
        subject: "Welcome to CV Forge — please verify your email",
        html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e0;">

        <tr><td style="background:#2d5a27;padding:32px 40px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:1px;">CV Forge</p>
        </td></tr>

        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 16px;font-size:18px;color:#1a1a1a;">Hi ${user.name},</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#444;">
            Welcome — we're glad you're here. You signed up for <strong>CV Forge</strong>, a tool for building clean, professional CVs that are ready to export.
          </p>
          <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#444;">
            Before you can sign in, we need to confirm that this email address belongs to you. Click the button below to verify and activate your account.
          </p>

          <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
            <tr><td style="background:#2d5a27;border-radius:8px;">
              <a href="${url}" style="display:block;padding:14px 32px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                Verify my email address
              </a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:13px;line-height:1.6;color:#888;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${url}" style="color:#2d5a27;word-break:break-all;">${url}</a>
          </p>
        </td></tr>

        <tr><td style="background:#f9f9f7;border-top:1px solid #e5e5e0;padding:20px 40px;">
          <p style="margin:0;font-size:12px;color:#aaa;line-height:1.6;">
            You received this email because someone signed up for CV Forge using this address.
            If that wasn't you, you can safely ignore this email — no account will be activated without verification.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
      });
      if (error) {
        console.error("[auth] Resend error:", safeError(error));
        throw new Error("Failed to send verification email");
      }
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
        after: async (user) => {
          try {
            await seedSkillCategories(user.id);
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
