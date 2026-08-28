import type { Dictionary } from "../en";

export const landing: Dictionary["landing"] = {
  hero: {
    titleLine1: "Skriv din historia,",
    titleLine2: "landa jobbet.",
    subtitle:
      "CV Forge låter dig samla allt ditt karriärinnehåll på ett ställe och exportera snyggt formaterade CV:n på några sekunder.",
    ctaSignedIn: "Mina CV:n →",
    ctaSignUp: "Kom igång — det är gratis →",
    ctaSignIn: "Har du redan ett konto? Logga in",
  },

  howItWorks: "Så fungerar det",

  steps: {
    import: {
      title: "Importera ditt befintliga CV",
      body: "Har du redan ett CV som PDF? Ladda upp det så hämtar vi din arbetslivserfarenhet, din utbildning och dina färdigheter automatiskt — du slipper skriva in allt på nytt.",
      tag: "valfri genväg",
    },
    library: {
      title: "Bygg ditt innehållsbibliotek",
      body: "Lägg till eller gå igenom dina personuppgifter, din arbetslivserfarenhet, din utbildning och dina färdigheter. Allt sparas en gång som återanvändbara byggstenar.",
    },
    build: {
      title: "Bygg ett CV",
      body: "Skapa ett nytt CV, välj en layout och plocka exakt vilket innehåll som ska vara med. Anpassa färger och stil så att det matchar dig.",
    },
    export: {
      title: "Exportera till PDF",
      body: "Ladda ner en pixelperfekt, utskriftsklar PDF på några sekunder. Dela den direkt eller skicka iväg den till nästa möjlighet.",
    },
  },

  data: {
    title: "Dina uppgifter, din kontroll",
    // Note where {settings} falls: mid-sentence and followed by a comma, which
    // English does not have. This is the sentence that a Before/After key pair
    // could not have expressed — see the comment in i18n/format.tsx.
    deleteBody:
      "Skapa konto med e-post och lösenord eller med ditt Google-konto — inget kreditkort, inga förpliktelser. Allt innehåll är ditt. Om du någon gång vill sluta raderar du ditt konto under {settings}, och varje uppgift som hör till kontot — CV:n, profiler, erfarenheter, utbildningar, färdigheter, alla övriga poster och alla foton du laddat upp — försvinner permanent och omedelbart.",
    privacyBody:
      "Ingen analys, ingen spårning, ingen reklam. Vad som lagras och vem mer som kan nå det står i {privacyPolicy}.",
    // Definite form: the sentence above reads "står i integritetspolicyn", so
    // the article is part of the link text rather than the surrounding string.
    privacyLink: "integritetspolicyn",
  },

  cta: {
    title: "Redo att komma igång?",
    body: "Skapa ditt konto på några sekunder. Inget kreditkort krävs.",
    button: "Skapa ett gratiskonto",
  },
};
