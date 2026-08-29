import { DEFAULT_LOCALE, INTL_LOCALES, isLocale, type Locale } from "@/i18n/config";
import type { TimelineEntry } from "@/lib/cv-timeline";

// The words printed *on* a CV.
//
// **This is not the app dictionary, and must never become it.** The two answer
// different questions:
//
//   dict.editor.sections.experience  →  the label on a control in the editor,
//                                       in the language the *user* is reading
//   cvStrings(cv.language).sections.experience
//                                    →  a heading in the exported PDF, in the
//                                       language the *CV* is written in
//
// Those are the same word today and will not be tomorrow: a Swedish speaker
// applying abroad keeps a Swedish interface and produces an English CV. That is
// the common case, not the exotic one, which is why `Cv.language` exists at all.
//
// Two consequences follow, and both are load-bearing:
//
// 1. **Nothing here may touch `next/root-params`.** The CV's language is *data*,
//    read from a column; the request's locale is a different fact about a
//    different thing. Reading root-params here would give exactly the wrong
//    answer in the one case the feature was built for. This module is plain and
//    synchronous, so it cannot even be tempted.
//
// 2. **The layouts are Server Components, so `CV_STRINGS` never reaches the
//    browser.** The one exception is `Paginated`, which is `"use client"` and
//    therefore takes its page label as a prop instead of importing this file —
//    importing it there would pull both languages into the bundle for one
//    string.

export type CvSectionStrings = {
  experience: string;
  /** Modern's heading, which is not the same string as `experience`. */
  workExperience: string;
  education: string;
  skills: string;
  projects: string;
  other: string;
  timeline: string;
  contact: string;
  /** Singular — Modern and Teal label their sidebar block "Language". */
  language: string;
  /** Plural — Slate and Terminal use "Languages". */
  languages: string;
  profile: string;
  /** Terminal's own name for the skills block. */
  techStack: string;
};

/**
 * The Europass headings, which are fixed by the template rather than chosen by
 * us — "Education and training", not "Education". Kept in their own object so a
 * reword of the ordinary headings cannot drift into the standardised ones.
 */
export type EuropassStrings = {
  workExperience: string;
  educationAndTraining: string;
  personalSkills: string;
  additionalInformation: string;
  personalInformation: string;
  profileSummary: string;
  languageSkills: string;
  language: string;
  cefrLevel: string;
  cefrFootnote: string;
  drivingLicence: string;
  address: string;
  telephone: string;
  email: string;
  nationality: string;
  dateOfBirth: string;
  linkedin: string;
  website: string;
};

export type CvStrings = {
  /**
   * The BCP 47 tag every `toLocaleDateString` in a layout formats against.
   * `en-GB` rather than `en`, or `Intl` renders `8/28/2026` — see `INTL_LOCALES`.
   */
  dateLocale: string;
  /** The end of an ongoing entry: "2019 – Present". */
  present: string;
  /** Introduces a job's or project's live URL. */
  liveAt: string;
  /** Introduces a project's repository URL. */
  source: string;
  /** The "Website" link in a header's contact row. LinkedIn and GitHub are proper nouns and stay. */
  website: string;
  /**
   * `format()`-style, with `{degree}` and `{field}`.
   *
   * A template rather than the ` in ${field}` fragment every layout used to
   * append, because the joining word moves: Swedish says "Kandidat i
   * datavetenskap" but a language that puts the field first has nowhere to put
   * a fragment that assumes it comes second.
   */
  degreeIn: string;
  /** `format()`-style, with `{level}`. A screen-reader label for the 1–5 dots. */
  levelOf: string;
  /** `format()`-style template with `{page}` and `{pages}`. */
  pageOf: string;
  sections: CvSectionStrings;
  /** The badge on a merged-timeline entry, saying which kind it is. */
  timelineType: Record<TimelineEntry["type"], string>;
  /** Skill levels 1–5, indexed 0–4. A tuple, so a translation cannot ship four. */
  proficiency: readonly [string, string, string, string, string];
  europass: EuropassStrings;
};

const en: CvStrings = {
  dateLocale: INTL_LOCALES.en,
  present: "Present",
  liveAt: "Live at:",
  source: "Source:",
  website: "Website",
  degreeIn: "{degree} in {field}",
  levelOf: "Level {level} of 5",
  pageOf: "Page {page} of {pages}",
  sections: {
    experience: "Experience",
    workExperience: "Work Experience",
    education: "Education",
    skills: "Skills",
    projects: "Projects",
    other: "Other",
    timeline: "Timeline",
    contact: "Contact",
    language: "Language",
    languages: "Languages",
    profile: "Profile",
    techStack: "Tech Stack",
  },
  timelineType: {
    experience: "Work",
    education: "Education",
    projects: "Project",
    other: "Other",
  },
  proficiency: ["Beginner", "Elementary", "Intermediate", "Advanced", "Fluent"],
  europass: {
    workExperience: "Work experience",
    educationAndTraining: "Education and training",
    personalSkills: "Personal skills",
    additionalInformation: "Additional information",
    personalInformation: "Personal information",
    profileSummary: "Profile summary",
    languageSkills: "Language skills",
    language: "Language",
    cefrLevel: "CEFR level",
    cefrFootnote:
      "Levels: A1/A2 Basic user · B1/B2 Independent user · C1/C2 Proficient user (Common European Framework of Reference).",
    drivingLicence: "Driving licence",
    address: "Address",
    telephone: "Telephone",
    email: "Email",
    nationality: "Nationality",
    dateOfBirth: "Date of birth",
    linkedin: "LinkedIn",
    website: "Website",
  },
};

const sv: CvStrings = {
  dateLocale: INTL_LOCALES.sv,
  present: "Nuvarande",
  liveAt: "Länk:",
  source: "Källkod:",
  website: "Webbplats",
  degreeIn: "{degree} i {field}",
  levelOf: "Nivå {level} av 5",
  pageOf: "Sida {page} av {pages}",
  sections: {
    experience: "Erfarenhet",
    workExperience: "Arbetslivserfarenhet",
    education: "Utbildning",
    skills: "Färdigheter",
    projects: "Projekt",
    other: "Övrigt",
    timeline: "Tidslinje",
    contact: "Kontakt",
    language: "Språk",
    // Swedish does not distinguish these two the way English does — "språk" is
    // both. Kept as separate keys anyway, because the English side does
    // distinguish them and collapsing the pair here would mean a future reword
    // of one silently rewording the other.
    languages: "Språk",
    profile: "Profil",
    techStack: "Teknik",
  },
  timelineType: {
    experience: "Arbete",
    education: "Utbildning",
    projects: "Projekt",
    other: "Övrigt",
  },
  proficiency: ["Nybörjare", "Grundläggande", "Medel", "Avancerad", "Flytande"],
  europass: {
    workExperience: "Arbetslivserfarenhet",
    educationAndTraining: "Utbildning",
    personalSkills: "Personliga färdigheter",
    additionalInformation: "Ytterligare information",
    personalInformation: "Personuppgifter",
    profileSummary: "Profilsammanfattning",
    languageSkills: "Språkkunskaper",
    language: "Språk",
    cefrLevel: "CEFR-nivå",
    cefrFootnote:
      "Nivåer: A1/A2 Nybörjare · B1/B2 Självständig användare · C1/C2 Avancerad användare (Gemensam europeisk referensram för språk).",
    drivingLicence: "Körkort",
    address: "Adress",
    telephone: "Telefon",
    email: "E-post",
    nationality: "Nationalitet",
    dateOfBirth: "Födelsedatum",
    linkedin: "LinkedIn",
    website: "Webbplats",
  },
};

/**
 * `Record<Locale, CvStrings>`, so a third entry in `LOCALES` fails to compile
 * here rather than rendering a CV with `undefined` headings.
 */
const CV_STRINGS: Record<Locale, CvStrings> = { en, sv };

/**
 * `const t = cvStrings(language);` — the first line of every layout.
 *
 * Takes the raw column, which is `NOT NULL DEFAULT 'en'` but arrives through
 * `LayoutProps` as an optional string, and validates it. An unknown value falls
 * back to English rather than throwing: a CV that renders in the wrong language
 * is a nuisance, a CV that refuses to render is lost work.
 */
export function cvStrings(language?: string | null): CvStrings {
  return CV_STRINGS[isLocale(language) ? language : DEFAULT_LOCALE];
}
