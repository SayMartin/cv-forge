import type { Dictionary } from "../en";

export const nav: Dictionary["nav"] = {
  // Plural of "CV" in Swedish is "CV:n". This is the first of many; the same
  // form turns up in the landing copy and, later, in the API error strings.
  myCvs: "Mina CV:n",
  myContent: "Mitt innehåll",
  importPdf: "Importera PDF",
  settings: "Inställningar",
  signIn: "Logga in",
  signUp: "Skapa konto",
  openMenu: "Öppna menyn",
  closeMenu: "Stäng menyn",

  language: {
    label: "Språk",
    // Lowercase: Swedish does not capitalise language names. Both only ever
    // appear mid-sentence in the two templates below, so this is safe — a key
    // that could start a sentence would need the capital.
    names: {
      sv: "svenska",
      en: "engelska",
    },
    switchTo: "Byt till {language}",
    current: "Nuvarande språk: {language}",
  },
};
