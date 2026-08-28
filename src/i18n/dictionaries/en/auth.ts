import type { AuthErrors } from "@/i18n/authErrors";

// Every error the library can raise, keyed by code rather than by its English
// message. See `authErrors.ts` for why.
//
// All flat sentences with no placeholders, which is a change from the old
// "Email not verified. Please check your inbox for <b>you@example.com</b>…".
// The address is in the email field directly above the message, so repeating it
// bought nothing and cost a `{placeholder}` in a string three of four forms
// cannot supply a value for — the exact drift this dictionary is shaped to
// avoid.
const errors: AuthErrors = {
  EMAIL_NOT_VERIFIED:
    "This email address has not been verified yet. Check your inbox for the verification link.",
  INVALID_EMAIL_OR_PASSWORD: "Wrong email address or password.",
  INVALID_EMAIL: "That does not look like a valid email address.",
  USER_ALREADY_EXISTS: "An account with that email address already exists.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "An account with that email address already exists.",
  PASSWORD_TOO_SHORT: "That password is too short.",
  PASSWORD_TOO_LONG: "That password is too long.",
  FAILED_TO_CREATE_USER: "The account could not be created. Please try again.",
  INVALID_TOKEN: "This link is not valid.",
  TOKEN_EXPIRED: "This link has expired.",
  SOCIAL_ACCOUNT_ALREADY_LINKED:
    "That Google account is already connected to another account here.",
  fallback: "Something went wrong. Please try again.",
};

export const auth = {
  errors,

  /** Between the Google button and the email form, on both pages. */
  or: "or",
  continueWithGoogle: "Continue with Google",

  /** On the eye button inside every password field. */
  showPassword: "Show password",
  hidePassword: "Hide password",

  /** Raised by the sign-up and reset forms before anything is sent. */
  passwordMismatch: "The passwords do not match.",

  signIn: {
    title: "Sign in",
    email: "Email",
    password: "Password",
    forgotPassword: "Forgot password?",
    submit: "Sign in",
    submitting: "Signing in…",
    verified: "Email verified — you can now sign in.",
    reset: "Password updated — you can now sign in with your new password.",
    noAccount: "No account yet?",
    createOne: "Create one",
  },

  signUp: {
    title: "Create account",
    name: "Full name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    submit: "Create account",
    submitting: "Creating account…",
    verificationSendFailed:
      "Your account was created, but we could not send the verification email. Please try again from the sign in page.",
    haveAccount: "Already have an account?",
    signIn: "Sign in",

    // Article 13 wants this at the point data is collected, so it sits on the
    // form rather than only in the footer.
    //
    // The link text is a separate key from `footer.privacy` on purpose. Swedish
    // takes the definite form inside a sentence — "beskrivs i
    // integritetspolicyn" — where the footer's standalone link is
    // "Integritetspolicy". One shared key would force one of the two to be wrong.
    privacyNotice:
      "By creating an account you agree to how your data is handled, described in the {privacyPolicy}.",
    privacyPolicy: "privacy policy",

    /** Shown in place of the form once the verification email is away. */
    sent: {
      title: "Check your email",
      body: "We sent a verification link to {email}. Click the link to activate your account.",
      backToSignIn: "Back to sign in",
    },
  },

  forgotPassword: {
    title: "Forgot password",
    intro:
      "Enter your email address and we will send you a link to reset your password.",
    email: "Email",
    submit: "Send reset link",
    submitting: "Sending…",
    backToSignIn: "Back to sign in",

    // Deliberately says "if" — the form reports success either way, so that a
    // stranger cannot use it to find out which addresses are registered.
    sent: {
      title: "Check your email",
      body: "If {email} is registered, you will receive a reset link shortly.",
    },
  },

  resetPassword: {
    title: "Choose a new password",
    password: "New password",
    confirmPassword: "Confirm new password",
    submit: "Set new password",
    submitting: "Saving…",

    /** No `?token=` in the URL — the link was mangled or is very old. */
    invalid: {
      title: "Invalid link",
      body: "This password reset link is invalid or has expired. Please request a new one.",
      request: "Request a new link",
    },
  },
};
