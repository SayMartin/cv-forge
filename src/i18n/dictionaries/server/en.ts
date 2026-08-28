import type { EmailTemplate } from "@/i18n/emails";

/**
 * The server-only dictionary: the two transactional emails, and nothing else.
 *
 * Separate from `dictionaries/en` for one hard reason and one soft one. The hard
 * one is that these are **functions**, and a function cannot cross the
 * server→client boundary — putting them in the dictionary that
 * `DictionaryProvider` serialises would break every page. The soft one is that
 * the client has no use for two sixty-line HTML templates, and shipping both
 * languages of them to the browser would be pure weight.
 *
 * Functions rather than strings with `{name}` placeholders, and that is the
 * whole reason this half of the i18n system looks different from the other: a
 * translation that forgets a placeholder compiles fine and renders "Hi ," to a
 * real person, whereas a translation that forgets an argument does not compile
 * at all. The client dictionary cannot have that because its values must
 * serialise; here nothing stops us.
 *
 * As with the client dictionary, English is the contract and is **not** `as
 * const` — the keys are checked, the words are not.
 */
export const resetPasswordEmail: EmailTemplate = {
  subject: "Reset your CV Forge password",
  body: ({ name }) => ({
    greeting: `Hi ${name},`,
    paragraphs: [
      "We received a request to reset the password for your CV Forge account. Click the button below to choose a new password.",
      "This link is valid for <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your password will not change.",
    ],
    button: "Reset my password",
    linkFallback: "If the button doesn't work, copy and paste this link into your browser:",
    footer:
      "You received this because a password reset was requested for the CV Forge account associated with this address. If that wasn't you, no action is needed.",
  }),
};

export const verificationEmail: EmailTemplate = {
  subject: "Welcome to CV Forge — please verify your email",
  body: ({ name }) => ({
    greeting: `Hi ${name},`,
    paragraphs: [
      "Welcome — we're glad you're here. You signed up for <strong>CV Forge</strong>, a tool for building clean, professional CVs that are ready to export.",
      "Before you can sign in, we need to confirm that this email address belongs to you. Click the button below to verify and activate your account.",
    ],
    button: "Verify my email address",
    linkFallback: "If the button doesn't work, copy and paste this link into your browser:",
    footer:
      "You received this email because someone signed up for CV Forge using this address. If that wasn't you, you can safely ignore this email — no account will be activated without verification.",
  }),
};

export const en = { resetPasswordEmail, verificationEmail };

export type ServerDictionary = typeof en;

/** The name of one email — what `sendAuthEmail` is asked for. */
export type EmailKind = keyof ServerDictionary;
