export const settings = {
  title: "Account settings",

  account: {
    heading: "Your account",
  },

  language: {
    title: "Language",
    description:
      "Applies to this account, on every device you sign in from. It does not change the language your CVs are written in — that is set per CV.",
    currentBadge: "current",
  },

  // Sits directly above the delete button on purpose: this is the moment
  // someone wants to know what deleting actually removes.
  //
  // As on the sign-up form, the link text is its own key rather than shared with
  // `footer.privacy` — Swedish needs the definite form inside a sentence.
  privacyNotice:
    "What is stored about you, who else can reach it, and exactly what deleting your account removes is described in the {privacyPolicy}.",
  privacyPolicy: "privacy policy",

  dangerZone: "Danger zone",

  delete: {
    title: "Delete account",
    description:
      "Permanently deletes your account, all CVs, and colour themes. This cannot be undone.",
    open: "Delete my account…",

    // The address is typed out to confirm, so it belongs inside the sentence
    // where the translation can put it — Swedish leads with the verb.
    confirm: "Type {email} to confirm.",
    submit: "Permanently delete",
    submitting: "Deleting…",
    cancel: "Cancel",
    failed: "Something went wrong. Please try again.",
  },
};
