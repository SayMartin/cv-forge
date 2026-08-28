export const cvs = {
  title: "My CVs",
  subtitle: "Each CV is a named selection of your saved entries.",
  empty: "No CVs yet — create one above.",

  // The date is formatted by `Intl` against the UI locale, not written into the
  // string, so this only has to place it. Swedish wants "Uppdaterad 28 aug.
  // 2026" with the abbreviation `Intl` chose, which is why the whole line is one
  // key rather than a label concatenated onto a date in JSX.
  updated: "Updated {date}",

  create: {
    // "e.g." and the example itself both translate — a Swedish user naming a CV
    // is not applying for the same job in the same language.
    placeholder: "CV name, e.g. Backend Engineer 2026",
    submit: "New CV",
    submitting: "Creating…",
    failed: "Could not create the CV. Please try again.",
  },

  duplicate: {
    label: "Duplicate",
    /** The `title=` tooltip, which has room to say what is duplicated. */
    tooltip: "Duplicate CV",
  },
};
