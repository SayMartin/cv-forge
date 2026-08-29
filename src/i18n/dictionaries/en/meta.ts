/**
 * Page titles and the site description — the strings that show up in a browser
 * tab, a bookmark and a search result rather than on the page.
 *
 * A separate slice rather than reuse of `nav` and the page headings, even where
 * the words currently match. A `<title>` is read out of context, so it says
 * "My CVs" where the `<h1>` on the same page can afford to say "Mina CV:n" once
 * the navbar has established where you are — and English title case here
 * ("Sign In") is not the sentence case the nav link uses ("Sign in"). Sharing
 * the key would mean a reworded tab silently renaming the navbar.
 *
 * `title.template` in the root layout appends " | CV Forge", so none of these
 * repeat the product name.
 */
export const meta = {
  /** The `<meta name="description">` for the whole site, and the OG description. */
  description:
    "Build, manage, and export polished CVs — your career story, beautifully told.",

  cvs: "My CVs",
  cvEditor: "CV Editor",
  cvPreview: "CV Preview",
  /** `{name}` is the CV's own name, which is user data and never translated. */
  cvPreviewNamed: "{name} — Preview",
  content: "My Content",
  settings: "Account Settings",
  importCv: "Import CV",

  signIn: "Sign In",
  signUp: "Sign Up",
  forgotPassword: "Forgot Password",
  resetPassword: "Reset Password",
};
