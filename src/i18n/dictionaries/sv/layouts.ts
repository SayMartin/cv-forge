import type { Dictionary } from "../en";

// The names stay as they are. "Classic" → "Klassisk" would translate, but
// "Modern", "Teal", "Slate", "Terminal" and "Europass" are a colour, a colour,
// a piece of software and an EU standard — translating one of six leaves a list
// that looks half-finished, and a picker's job is to let you tell six thumbnails
// apart, which the names barely help with anyway. The descriptions do carry
// meaning, so those are translated.
export const layouts: Dictionary["layouts"] = {
  default: {
    name: "Classic",
    description: "Ren typografi på ljusgrå bakgrund.",
  },
  modern: {
    name: "Modern",
    description: "Tvåspaltig layout med mörk sidopanel och guldaccenter.",
  },
  teal: {
    name: "Teal",
    description: "Turkos sidopanel med nivåstaplar och tydliga sektionsrubriker.",
  },
  slate: {
    name: "Slate",
    description:
      "Mörkgrå sidopanel med indigoaccenter, grupperade färdigheter med punktbetyg och rena tekniketiketter.",
  },
  terminal: {
    name: "Terminal",
    description:
      "Mörk layout i GitHub-stil med typsnitt med fast bredd och färdigheter som kodetiketter. Byggd för utvecklare.",
  },
  europass: {
    name: "Europass",
    description:
      "EU-standardiserad CV-struktur med personuppgifter, CEFR-tabell för språk och daterade tidslinjeavsnitt.",
  },
};
