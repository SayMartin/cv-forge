import type { Locale } from "./config";

// The shape of a transactional email, and the one HTML shell all of them render
// into.
//
// The shell lives here rather than inside each translation on purpose. There are
// two emails and two languages, so a template that carried its own markup would
// exist in four copies of the same fifty lines of table layout — and a padding
// tweak would be four edits, three of which are easy to forget. Here the words
// are translated and the markup is not, which is the split that actually matches
// what changes.
//
// Deliberately free of any Next, Resend or Prisma import: this module is pure,
// so it can be exercised from a script without standing up the app.

/**
 * What the translations interpolate.
 *
 * **These arrive HTML-escaped.** `name` is whatever the user typed into the
 * sign-up form, and it lands inside a `<p>`; `url` lands inside an `href`.
 * `renderEmail` escapes both before calling the template, so a template body may
 * drop them straight into markup — and must not escape them a second time.
 */
export type EmailVars = { name: string; url: string };

/** The translated parts of one email, in the order the shell renders them. */
export type EmailBody = {
  /** "Hi Martin," — already carries the trailing comma; Swedish may not want one. */
  greeting: string;
  /** Rendered as one `<p>` each. May contain inline markup such as `<strong>`. */
  paragraphs: string[];
  /** The label on the call-to-action button. */
  button: string;
  /** The line introducing the copy-and-paste fallback link. */
  linkFallback: string;
  /** The small print under the rule, explaining why this message arrived. */
  footer: string;
};

export type EmailTemplate = {
  /**
   * **Plain text — never HTML.** A mail header is not markup, so an escaped
   * `&amp;` would be shown literally in the inbox list. This is a flat string
   * rather than a function for exactly that reason: it cannot accidentally be
   * built from the escaped values that `body` receives.
   */
  subject: string;
  /** Typed arguments, so a translation cannot quietly drop `{name}` the way an interpolated string can. */
  body: (vars: EmailVars) => EmailBody;
};

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Escapes a value on its way into email markup.
 *
 * `name` is user-supplied and was interpolated raw before this change. Mail
 * clients do not run scripts, so this was never an XSS in the browser sense —
 * but a display name containing `<` was enough to tear the layout apart, and an
 * `<a>` smuggled into the greeting of a message that genuinely comes from us is
 * a phishing primitive worth closing.
 *
 * `url` is escaped too. It is app-generated and safe, but its query string
 * carries `&` between `token` and `callbackURL`, and a bare `&` inside an
 * `href` attribute is malformed HTML that some clients truncate at.
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

/**
 * `renderEmail("sv", dict.verificationEmail, { name, url })` → what Resend sends.
 *
 * The `lang` on `<html>` is the point of taking a locale here: a screen reader
 * or a translation prompt reading a Swedish message tagged `lang="en"` gets it
 * wrong, and both templates were hardcoded to `en` before this.
 */
export function renderEmail(
  locale: Locale,
  template: EmailTemplate,
  vars: EmailVars,
): { subject: string; html: string } {
  const safe: EmailVars = {
    name: escapeHtml(vars.name),
    url: escapeHtml(vars.url),
  };
  const body = template.body(safe);

  // The final paragraph carries a wider bottom margin than the rest: it is the
  // one that sits directly above the button, and the extra 12px is what keeps
  // the call to action from crowding the sentence that leads into it. Both
  // templates were written that way by hand; keeping it here preserves the
  // rendering byte for byte.
  const last = body.paragraphs.length - 1;
  const paragraphs = body.paragraphs
    .map(
      (text, i) =>
        `          <p style="margin:0 0 ${i === last ? 28 : 16}px;font-size:15px;line-height:1.6;color:#444;">
            ${text}
          </p>`,
    )
    .join("\n");

  return {
    subject: template.subject,
    html: `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e0;">

        <tr><td style="background:#2d5a27;padding:32px 40px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:1px;">CV Forge</p>
        </td></tr>

        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 16px;font-size:18px;color:#1a1a1a;">${body.greeting}</p>
${paragraphs}

          <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
            <tr><td style="background:#2d5a27;border-radius:8px;">
              <a href="${safe.url}" style="display:block;padding:14px 32px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                ${body.button}
              </a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:13px;line-height:1.6;color:#888;">
            ${body.linkFallback}<br>
            <a href="${safe.url}" style="color:#2d5a27;word-break:break-all;">${safe.url}</a>
          </p>
        </td></tr>

        <tr><td style="background:#f9f9f7;border-top:1px solid #e5e5e0;padding:20px 40px;">
          <p style="margin:0;font-size:12px;color:#aaa;line-height:1.6;">
            ${body.footer}
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}
