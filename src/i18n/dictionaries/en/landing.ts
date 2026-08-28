export const landing = {
  hero: {
    // Two keys, not one string with a "\n": the heading breaks on a deliberate
    // <br> and each half has to stand on its own line in both languages.
    titleLine1: "Craft your story,",
    titleLine2: "land the role.",
    subtitle:
      "CV Forge lets you manage your career content in one place and export beautifully formatted CVs in seconds.",
    ctaSignedIn: "My CVs →",
    ctaSignUp: "Get started — it's free →",
    ctaSignIn: "Already have an account? Sign in",
  },

  howItWorks: "How it works",

  // Named, not an array. `Dictionary` is `typeof en` with no `as const`, so an
  // array widens to `Step[]` and a Swedish translation missing its fourth entry
  // would compile. Four named keys make that a type error. The 01–04 numerals
  // live in the component: they are not language.
  steps: {
    import: {
      title: "Import your existing CV",
      body: "Already have a PDF CV? Upload it and we'll extract your work history, education, and skills automatically — no manual re-entry needed.",
      tag: "optional shortcut",
    },
    library: {
      title: "Build your content library",
      body: "Add or review your personal details, work experience, education, and skills. Everything is stored once as reusable building blocks.",
    },
    build: {
      title: "Build a CV",
      body: "Create a new CV, choose a layout, and pick exactly which content to include. Customise colours and style to match your brand.",
    },
    export: {
      title: "Export to PDF",
      body: "Download a pixel-perfect, print-ready PDF in seconds. Share it directly or send it off to your next opportunity.",
    },
  },

  data: {
    title: "Your data, your control",
    // {settings} — the Settings link text, emphasised inline. See RichText.
    deleteBody:
      "Sign up with email and password or your Google account — no credit card, no obligations. All your content belongs to you. If you ever want to leave, delete your account from {settings} and every piece of data associated with your account — CVs, profiles, experience, education, skills, all other entries, and any photos you uploaded — is permanently and immediately erased.",
    // {privacyPolicy} — a link to /privacy, worded by `privacyLink` below.
    privacyBody:
      "No analytics, no tracking, no advertising. What is stored and who else can reach it is spelled out in the {privacyPolicy}.",
    privacyLink: "privacy policy",
  },

  cta: {
    title: "Ready to get started?",
    body: "Create your account in seconds. No credit card required.",
    button: "Create a free account",
  },
};
