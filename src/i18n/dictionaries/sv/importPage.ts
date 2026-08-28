import type { PluralForms } from "@/i18n/format";
import type { Dictionary } from "../en";

const counts: Record<keyof Dictionary["importPage"]["success"]["counts"], PluralForms> = {
  experience: { one: "{count} erfarenhet", other: "{count} erfarenheter" },
  education: { one: "{count} utbildning", other: "{count} utbildningar" },
  skills: { one: "{count} färdighet", other: "{count} färdigheter" },
  // "Projekt" is neuter with a zero plural ending, so both forms are identical.
  // Written out anyway rather than collapsed to one string: the pair is the
  // contract, and a language where they differ is one file away.
  projects: { one: "{count} projekt", other: "{count} projekt" },
  other: { one: "{count} övrig post", other: "{count} övriga poster" },
};

export const importPage: Dictionary["importPage"] = {
  title: "Importera CV från PDF",
  intro:
    "Ladda upp ett CV som PDF så extraheras innehållet av AI och läggs till i ditt innehållsbibliotek. En ny profil skapas utifrån dina personuppgifter. Alla andra poster — erfarenheter, utbildningar, färdigheter, projekt och certifikat — läggs till som nya poster redo att användas i dina CV:n.",

  limits: "Upp till 10 sidor och 10 MB.",

  selectFile: "Klicka för att välja en PDF…",
  submit: "Importera CV",
  submitting: "Importerar…",

  networkError: "Nätverksfel — försök igen.",

  success: {
    title: "Importen lyckades ✓",
    profile: "Profil skapad",
    counts,
    review: "Granska och redigera under {myContent}.",
  },

  failure: {
    title: "Importen misslyckades",
  },
};
