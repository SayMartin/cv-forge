import type { Dictionary } from "../en";

export const content: Dictionary["content"] = {
  title: "Mitt innehåll",
  subtitle: "Hantera ditt karriärinnehåll. Allt här kan läggas till i ett CV.",

  tabs: {
    profiles: "Profiler",
    experience: "Erfarenhet",
    education: "Utbildning",
    skills: "Färdigheter",
    projects: "Projekt",
    other: "Övrigt",
    avatars: "Foton",
  },

  form: {
    create: "Skapa",
    save: "Spara ändringar",
    saving: "Sparar…",
    cancel: "Avbryt",
    edit: "Redigera",
    delete: "Radera",
    deleting: "Raderar…",
    saveFailed: "Kunde inte spara",
    createFailed: "Kunde inte skapa",
    updateFailed: "Kunde inte uppdatera",
    deleteFailed: "Kunde inte radera",
  },

  present: "Nuvarande",

  profiles: {
    add: "+ Lägg till profil",
    new: "Ny profil",
    edit: "Redigera profil",
    create: "Skapa profil",
    empty: "Inga profiler än — lägg till en ovan.",
    confirmDelete: "Radera den här profilen?",
    europass: "Europass-uppgifter (valfritt)",
    social: "Sociala länkar",
    fields: {
      profileName: { label: "Profilnamn *", placeholder: 't.ex. "Frontendutvecklare"' },
      name: { label: "Fullständigt namn *", placeholder: "Anna Andersson" },
      headline: { label: "Rubrik", placeholder: "Senior systemutvecklare" },
      email: { label: "E-post", placeholder: "anna@exempel.se" },
      phone: { label: "Telefon", placeholder: "+46 70 123 45 67" },
      location: { label: "Ort", placeholder: "Stockholm, Sverige" },
      bio: { label: "Presentation", placeholder: "En kort sammanfattning om dig själv…" },
      nationality: { label: "Nationalitet", placeholder: "Svensk" },
      dateOfBirth: { label: "Födelsedatum" },
      drivingLicense: { label: "Körkort", placeholder: "B" },
      linkedin: { label: "LinkedIn", placeholder: "https://linkedin.com/in/…" },
      github: { label: "GitHub", placeholder: "https://github.com/…" },
      website: { label: "Webbplats", placeholder: "https://dinsida.se" },
      portfolio: { label: "Portfolio", placeholder: "https://portfolio.se" },
    },
  },

  experience: {
    add: "+ Lägg till erfarenhet",
    new: "Ny erfarenhet",
    edit: "Redigera erfarenhet",
    empty: "Inga erfarenheter än — lägg till en ovan.",
    confirmDelete: "Radera den här erfarenheten?",
    current: "Nuvarande tjänst",
    fields: {
      company: { label: "Företag *", placeholder: "Acme AB" },
      role: { label: "Roll / titel *", placeholder: "Senior utvecklare" },
      startDate: { label: "Startdatum", placeholder: "2021 eller 2021-06" },
      endDate: { label: "Slutdatum", placeholder: "2024 eller 2024-03" },
      description: { label: "Beskrivning", placeholder: "Huvudsakligt ansvar och resultat…" },
      url: { label: "Webbadress", placeholder: "https://exempel.se" },
      skills: { label: "Färdigheter som användes (kommaseparerat)", placeholder: "React, TypeScript, Node.js" },
    },
  },

  education: {
    add: "+ Lägg till utbildning",
    new: "Ny utbildning",
    edit: "Redigera utbildning",
    empty: "Inga utbildningar än — lägg till en ovan.",
    confirmDelete: "Radera den här utbildningen?",
    current: "Studerar just nu",
    degreeIn: "{degree} i {field}",
    fields: {
      institution: { label: "Lärosäte *", placeholder: "Uppsala universitet, KTH…" },
      degree: { label: "Examen", placeholder: "Kandidat, magister, doktor…" },
      field: { label: "Inriktning", placeholder: "Datavetenskap" },
      startDate: { label: "Startdatum", placeholder: "2018 eller 2018-09" },
      endDate: { label: "Slutdatum", placeholder: "2022 eller 2022-06" },
      description: { label: "Beskrivning", placeholder: "Relevanta kurser, examensarbete, aktiviteter…" },
    },
  },

  skills: {
    add: "+ Lägg till färdighet",
    new: "Ny färdighet",
    editing: "Redigera {name}",
    empty: "Inga färdigheter än — lägg till en ovan.",
    confirmDelete: 'Radera "{name}"? Den försvinner från alla CV:n som använder den.',
    cefrNone: "— ingen —",
    fields: {
      name: { label: "Namn *", placeholder: "TypeScript" },
      level: { label: "Nivå (1–5)", placeholder: "t.ex. 4" },
      cefr: { label: "CEFR-nivå" },
    },

    categories: {
      title: "Kategorier",
      description:
        "Din egen gruppering. Klicka på ett namn för att byta det. Vilka kategorier ett CV visar, i vilken ordning och vilka färdigheter som hamnar i varje bestäms per CV i CV-editorn. Språkkategorin är fast — Europass-layouten behöver den.",
      empty: "Inga kategorier än — lägg till en nedan.",
      renameLabel: "Byt namn på {name}",
      languageBadge: "CEFR",
      languageTooltip:
        "Talade språk — aktiverar CEFR-nivåer och Europass språktabell. Fast: kan varken byta namn eller raderas.",
      newPlaceholder: "Ny kategori",
      newLabel: "Namn på ny kategori",
      atLimit: "Taket på {max} är nått",
      add: "Lägg till",
      renameFailed: "Kunde inte byta namn",
      addFailed: "Kunde inte lägga till kategorin",
    },
  },

  projects: {
    add: "+ Lägg till projekt",
    // Neuter: "ett projekt" — so "Nytt", not "Ny", unlike every other tab here.
    new: "Nytt projekt",
    edit: "Redigera projekt",
    empty: "Inga projekt än — lägg till ett ovan.",
    confirmDelete: "Radera det här projektet?",
    current: "Pågående projekt",
    fields: {
      title: { label: "Titel *", placeholder: "Mitt projekt" },
      summary: { label: "Sammanfattning", placeholder: "Kort beskrivning av projektet…" },
      startDate: { label: "Startdatum", placeholder: "2024 eller 2024-06" },
      endDate: { label: "Slutdatum", placeholder: "2024 eller 2024-09" },
      url: { label: "Webbadress", placeholder: "https://mittprojekt.se" },
      sourceUrl: { label: "Källkod / GitHub", placeholder: "https://github.com/…" },
      skills: { label: "Tekniker (kommaseparerat)", placeholder: "React, Node.js, PostgreSQL" },
      publishedAt: { label: "Publiceringsdatum" },
    },
  },

  other: {
    add: "+ Lägg till post",
    new: "Ny post",
    edit: "Redigera post",
    empty: "Inga poster än — lägg till en ovan.",
    confirmDelete: "Radera den här posten?",
    fields: {
      title: { label: "Titel *", placeholder: 't.ex. "AWS Certified Developer"' },
      subtitle: { label: "Underrubrik", placeholder: "Utfärdare eller organisation" },
      date: { label: "Datum", placeholder: "2023 eller 2023-06" },
      url: { label: "Webbadress", placeholder: "https://certifikat.lank" },
      description: { label: "Beskrivning", placeholder: "Detaljer om den här meriten…" },
    },
  },

  avatars: {
    intro: "Du kan ladda upp {max} foton. Vilket som visas på ett CV väljer du i CV-editorn.",
    add: "Lägg till",
    alt: "Porträttbild",
    remove: "Ta bort foto",
    atLimit: "Taket på {max} foton är nått. Ta bort ett för att lägga till ett nytt.",
    uploadFailed: "Uppladdningen misslyckades",
  },
};
