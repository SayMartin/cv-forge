/**
 * My Content — the seven tabs, their forms, and the skill-category manager.
 *
 * The seven tabs are near-identical CRUD panels, so the verbs they share live
 * once in `form` rather than seven times over. That is not only about key
 * count: "Save changes" appearing in seven places is seven chances for one of
 * them to end up as "Spara" and the rest as "Spara ändringar", and nothing
 * would ever flag it. One key cannot drift from itself.
 *
 * Field labels and their placeholders are paired in one object per field. A
 * placeholder is an example, and an example that still reads "Acme Corp" and
 * "Jane Smith" under Swedish labels is the tell that a translation was done
 * halfway. Pairing them means a translator sees both at once, and a field with
 * no placeholder simply has no `placeholder` key — so `tsc` asks for exactly
 * the ones that exist rather than accepting an optional that silently vanished.
 */
export const content = {
  title: "My Content",
  subtitle: "Manage your career content. Everything here can be added to a CV.",

  // Keyed by tab id. `ContentTabs` indexes this with its own `TabId` union, so
  // a tab added there without a label here fails to compile at the use site.
  tabs: {
    profiles: "Profiles",
    experience: "Experience",
    education: "Education",
    skills: "Skills",
    projects: "Projects",
    other: "Other",
    avatars: "Photos",
  },

  // Shared by every tab. `deleteFailed` is borrowed by the photos tab too,
  // which has no form of its own but reports the same failure.
  form: {
    create: "Create",
    save: "Save changes",
    saving: "Saving…",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    deleting: "Deleting…",
    saveFailed: "Save failed",
    createFailed: "Failed to create",
    updateFailed: "Failed to update",
    deleteFailed: "Delete failed",
  },

  /**
   * The end of a date range that has no end yet, in the summary line of an
   * entry. Deliberately *not* shared with the identical word on a rendered CV:
   * that one follows `cv.language` and this one follows the UI locale, so a
   * Swedish user writing an English CV needs them to disagree.
   */
  present: "Present",

  profiles: {
    add: "+ Add profile",
    new: "New profile",
    edit: "Edit profile",
    // The only tab whose create button names the thing; the rest say "Create".
    create: "Create profile",
    empty: "No profiles yet — add one above.",
    confirmDelete: "Delete this profile?",
    europass: "Europass details (optional)",
    social: "Social links",
    fields: {
      profileName: { label: "Profile label *", placeholder: 'e.g. "Frontend Developer"' },
      name: { label: "Full name *", placeholder: "Jane Smith" },
      headline: { label: "Headline", placeholder: "Senior Software Engineer" },
      email: { label: "Email", placeholder: "jane@example.com" },
      phone: { label: "Phone", placeholder: "+1 555 000 0000" },
      location: { label: "Location", placeholder: "Stockholm, Sweden" },
      bio: { label: "Bio", placeholder: "A short summary about yourself…" },
      nationality: { label: "Nationality", placeholder: "Swedish" },
      dateOfBirth: { label: "Date of birth" },
      drivingLicense: { label: "Driving license", placeholder: "B" },
      linkedin: { label: "LinkedIn", placeholder: "https://linkedin.com/in/…" },
      github: { label: "GitHub", placeholder: "https://github.com/…" },
      website: { label: "Website", placeholder: "https://yoursite.com" },
      portfolio: { label: "Portfolio", placeholder: "https://portfolio.com" },
    },
  },

  experience: {
    add: "+ Add experience",
    new: "New experience",
    edit: "Edit experience",
    empty: "No experience entries yet — add one above.",
    confirmDelete: "Delete this experience entry?",
    current: "Current position",
    fields: {
      company: { label: "Company *", placeholder: "Acme Corp" },
      role: { label: "Role / Title *", placeholder: "Senior Engineer" },
      startDate: { label: "Start date", placeholder: "2021 or 2021-06" },
      endDate: { label: "End date", placeholder: "2024 or 2024-03" },
      description: { label: "Description", placeholder: "Key responsibilities and achievements…" },
      url: { label: "Live URL", placeholder: "https://example.com" },
      skills: { label: "Skills used (comma-separated)", placeholder: "React, TypeScript, Node.js" },
    },
  },

  education: {
    add: "+ Add education",
    new: "New education",
    edit: "Edit education",
    empty: "No education entries yet — add one above.",
    confirmDelete: "Delete this education entry?",
    current: "Currently studying",
    // The summary line: "B.Sc. in Computer Science". A one-word join, and
    // exactly the kind that gets left behind in JSX — Swedish needs "i".
    degreeIn: "{degree} in {field}",
    fields: {
      institution: { label: "Institution *", placeholder: "MIT, Uppsala University…" },
      degree: { label: "Degree", placeholder: "B.Sc., M.Sc., PhD…" },
      field: { label: "Field of study", placeholder: "Computer Science" },
      startDate: { label: "Start date", placeholder: "2018 or 2018-09" },
      endDate: { label: "End date", placeholder: "2022 or 2022-06" },
      description: { label: "Description", placeholder: "Relevant coursework, thesis, activities…" },
    },
  },

  skills: {
    add: "+ Add skill",
    new: "New skill",
    editing: "Edit {name}",
    empty: "No skills yet — add one above.",
    confirmDelete: 'Delete "{name}"? It will disappear from every CV that uses it.',
    cefrNone: "— none —",
    fields: {
      name: { label: "Name *", placeholder: "TypeScript" },
      level: { label: "Level (1–5)", placeholder: "e.g. 4" },
      cefr: { label: "CEFR level" },
    },

    categories: {
      title: "Categories",
      description:
        "Your own grouping. Click a name to rename it. Which categories a CV shows, in what order, and which skills go in each is decided per CV in the CV editor. The language category is fixed — the Europass layout needs it.",
      empty: "No categories yet — add one below.",
      renameLabel: "Rename {name}",
      languageBadge: "CEFR",
      languageTooltip:
        "Spoken languages — enables CEFR levels and the Europass language table. Fixed: cannot be renamed or deleted.",
      newPlaceholder: "New category",
      newLabel: "New category name",
      atLimit: "Limit of {max} reached",
      add: "Add",
      renameFailed: "Rename failed",
      addFailed: "Could not add category",
    },
  },

  projects: {
    add: "+ Add project",
    new: "New project",
    edit: "Edit project",
    empty: "No projects yet — add one above.",
    confirmDelete: "Delete this project?",
    current: "Ongoing project",
    fields: {
      title: { label: "Title *", placeholder: "My Project" },
      summary: { label: "Summary", placeholder: "Short description of the project…" },
      startDate: { label: "Start date", placeholder: "2024 or 2024-06" },
      endDate: { label: "End date", placeholder: "2024 or 2024-09" },
      url: { label: "Live URL", placeholder: "https://myproject.com" },
      sourceUrl: { label: "Source / GitHub URL", placeholder: "https://github.com/…" },
      skills: { label: "Technologies (comma-separated)", placeholder: "React, Node.js, PostgreSQL" },
      publishedAt: { label: "Published date" },
    },
  },

  other: {
    add: "+ Add entry",
    new: "New entry",
    edit: "Edit entry",
    empty: "No entries yet — add one above.",
    confirmDelete: "Delete this entry?",
    fields: {
      title: { label: "Title *", placeholder: 'e.g. "AWS Certified Developer"' },
      subtitle: { label: "Subtitle", placeholder: "Issuer or organisation" },
      date: { label: "Date", placeholder: "2023 or 2023-06" },
      url: { label: "URL", placeholder: "https://certificate.link" },
      description: { label: "Description", placeholder: "Details about this achievement…" },
    },
  },

  avatars: {
    intro: "Upload up to {max} photos. Select which one to show in each CV from the CV editor.",
    add: "Add",
    /** The <img> alt. Every photo here is the account holder's own portrait. */
    alt: "Profile photo",
    remove: "Remove photo",
    atLimit: "Limit of {max} photos reached. Remove one to add another.",
    uploadFailed: "Upload failed",
  },
};
