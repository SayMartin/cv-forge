import type { Dictionary } from "../en";

export const settings: Dictionary["settings"] = {
  title: "Kontoinställningar",

  account: {
    heading: "Ditt konto",
  },

  language: {
    title: "Språk",
    description:
      "Gäller för det här kontot, på varje enhet du loggar in från. Det ändrar inte språket dina CV:n är skrivna på — det ställs in per CV.",
    currentBadge: "nuvarande",
  },

  privacyNotice:
    "Vad som lagras om dig, vem mer som kan nå det och exakt vad som tas bort när du raderar kontot beskrivs i {privacyPolicy}.",
  privacyPolicy: "integritetspolicyn",

  dangerZone: "Farozon",

  delete: {
    title: "Radera konto",
    description:
      "Raderar permanent ditt konto, alla CV:n och färgteman. Detta går inte att ångra.",
    open: "Radera mitt konto…",

    confirm: "Skriv {email} för att bekräfta.",
    submit: "Radera permanent",
    submitting: "Raderar…",
    cancel: "Avbryt",
    failed: "Något gick fel. Försök igen.",
  },
};
