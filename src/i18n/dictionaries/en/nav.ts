import type { Locale } from "@/i18n/config";

// The names are exonyms — "Swedish" in the English dictionary, "engelska" in the
// Swedish one — not autonyms. They are only ever read aloud, inside an
// `aria-label` on an element carrying the *page's* language, so a foreign word
// there would be pronounced with the wrong phonemes. The visible label on the
// toggle is the flag plus the language code, which needs no translation.
//
// Typed `Record<Locale, string>` rather than left to inference: a third locale
// then fails to compile in both dictionaries instead of quietly showing "{name}".
const names: Record<Locale, string> = {
  sv: "Swedish",
  en: "English",
};

export const nav = {
  myCvs: "My CVs",
  myContent: "My Content",
  importPdf: "Import PDF",
  settings: "Settings",
  signIn: "Sign in",
  signUp: "Sign up",
  openMenu: "Open menu",
  closeMenu: "Close menu",

  language: {
    /** Labels the toggle as a group, so it is not read as two loose links. */
    label: "Language",
    names,
    switchTo: "Switch to {language}",
    current: "Current language: {language}",
  },
};
