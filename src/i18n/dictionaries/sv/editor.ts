import type { Dictionary } from "../en";

export const editor: Dictionary["editor"] = {
  switchCv: "Byt CV",
  preview: "Förhandsgranska",

  unsavedChanges: "Det här CV:t har osparade ändringar. Lämna utan att spara?",

  name: { label: "CV-namn" },

  targetRole: {
    label: "Anpassat för",
    placeholder: "t.ex. Acme AB — senior designer",
    help: "Visas bara i CV-listan — skrivs inte ut.",
  },

  save: {
    idle: "Spara",
    dirty: "Spara ändringar",
    saving: "Sparar…",
    saved: "Sparat ✓",
    failed: "Kunde inte spara",
  },

  revert: {
    label: "Återställ",
    confirm: "Kasta alla osparade ändringar?",
  },

  deleteCv: {
    label: "Radera CV",
    deleting: "Raderar…",
    confirm: 'Radera "{name}"? Det går inte att ångra.',
    failed: "Kunde inte radera",
  },

  selectAll: "Alla",
  selectNone: "Inga",

  dragToReorder: "Dra för att ändra ordning",

  layout: { title: "Layout" },

  theme: {
    title: "Färgtema",
    // "Standard" rather than "Förvald": this is the option that uses the
    // layout's own colours, which is what the layout looks like as standard.
    none: "Standard",
    create: "+ Nytt tema",
    creating: "Skapar…",
    newName: "Mitt tema",
    saved: "Sparat ✓",
    delete: "Radera",
    confirmDelete: "Radera det här temat? CV:n som använder det förlorar sina färginställningar.",
    sidebar: "Sidopanel",
    accent: "Accent",
  },

  profile: { title: "Profil" },

  avatar: {
    title: "Profilbild",
    none: "Ingen",
    alt: "Profilbild {number}",
  },

  sections: {
    experience: "Erfarenhet",
    education: "Utbildning",
    skills: "Färdigheter",
    projects: "Projekt",
    other: "Övrigt",
  },

  entries: {
    experience: "{role} @ {company}",
    education: "{degree} — {institution}",
    degreeFallback: "Examen",
    other: "{title} — {subtitle}",
  },

  skills: {
    dropHere: "Dra färdigheter hit",
    unplaced: "Inte med i det här CV:t",
    allPlaced: "Alla färdigheter är placerade.",
    include: "Ta med {name}",
    move: "Flytta {name} till en annan kategori",
    show: "Visa {category} i det här CV:t",
    reorder: "Ändra ordning på {category}",
  },

  timeline: {
    title: "Tidslinje",
    grouped: {
      label: "Grupperat per avsnitt",
      description:
        "Erfarenhet, Utbildning, Projekt och Övrigt renderas var för sig som egna block, i ordningen nedan.",
    },
    chronological: {
      label: "Blandat, kronologisk ordning",
      description:
        "Erfarenhet, Utbildning, Projekt och Övrigt slås ihop till en tidslinje sorterad efter datum (senaste först). Färdigheter hålls separat.",
    },
  },

  sectionOrder: {
    title: "Avsnittsordning",
    help: "Håll in och dra för att ändra ordning på avsnitten i ditt CV.",
  },

  coverLetter: {
    title: "Personligt brev",
    placeholder: "Skriv ett personligt brev för den här ansökan…",
    help: "Skrivs ut som en egen sida före CV:t när det inte är tomt.",
  },

  view: {
    // "Tillbaka till" followed by the CV's name, so the preposition has to be
    // the one that fits a name rather than a section.
    backTo: "Tillbaka till",
    exportPdf: "Spara som PDF",
  },
};
