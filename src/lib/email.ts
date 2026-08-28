import { Resend } from "resend";
import { emailLocale, serverDictionaryFor, type EmailKind } from "@/i18n/dictionaries/server";
import { renderEmail } from "@/i18n/emails";
import { safeError } from "@/lib/log";

const EMAIL_FROM = process.env.EMAIL_FROM ?? "CV Forge <noreply@appfinningar.se>";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * What the console calls each message outside production. Keyed by `EmailKind`,
 * so a third email gets a label or does not compile — the subject line would
 * have done as a label, but it is the translated one, and a dev log that
 * changes language with the account is a poor thing to grep for.
 */
const DEV_LABEL: Record<EmailKind, string> = {
  resetPasswordEmail: "Password reset link",
  verificationEmail: "Verification link",
};

/**
 * Send one of the transactional emails, in the recipient's language.
 *
 * The locale comes from `user.locale` — the account preference, not the request
 * — and that is the only thing it could come from. Both callers are Better Auth
 * option callbacks running inside a Route Handler, where `next/root-params` is
 * unavailable; the reset email is not even triggered from a page, it is
 * triggered by an address typed into a form. The account column is the one
 * durable answer to "what language does this person read".
 *
 * Throws on failure, and logs before it does. Whether that throw matters is the
 * caller's business: the verification path lets it reach the client, the reset
 * path swallows it. See `auth.ts`.
 */
export async function sendAuthEmail(
  kind: EmailKind,
  user: { name: string; email: string; locale?: string | null },
  url: string,
): Promise<void> {
  const locale = emailLocale(user.locale);
  const { subject, html } = renderEmail(
    locale,
    serverDictionaryFor(locale)[kind],
    { name: user.name, url },
  );

  /**
   * Outside production, print the link rather than sending it.
   *
   * `.env.local` carries live Resend credentials, so without this every test
   * sign-up delivers a real message from the production sender and spends its
   * reputation on throwaway accounts. Database and storage are separated per
   * environment; this was the last dependency that was not.
   *
   * The resolved locale and subject are printed alongside the link because they
   * are otherwise unobservable in development: composing the message and never
   * sending it is exactly the state where "did this come out in Swedish?" has
   * no other way to be answered.
   */
  if (!IS_PRODUCTION) {
    console.log(
      `\n[email] ${DEV_LABEL[kind]} for ${user.email} — development, no email sent` +
        `\n        locale: ${locale} · subject: ${subject}` +
        `\n        ${url}\n`,
    );
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("[email] RESEND_API_KEY is not set");
    throw new Error("Email service is not configured");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: user.email,
    subject,
    html,
  });

  if (error) {
    // `safeError`, not the object: a Resend validation error names the
    // recipient address, and container stdout is outside every retention
    // policy this app has.
    console.error(`[email] Resend error (${kind}):`, safeError(error));
    throw new Error(`Failed to send ${kind}`);
  }
}
