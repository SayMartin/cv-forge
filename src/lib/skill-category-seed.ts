import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";

// The skill categories a brand-new account starts with.
//
// **These are seed data, not UI strings, and the difference is the whole reason
// they are not in `src/i18n/dictionaries/`.** They are written to
// `skill_category` rows once, at sign-up, and from that moment they belong to
// the user: they can be renamed, reordered and deleted, and nothing in the app
// ever writes them again. A dictionary is re-read on every render, so putting
// them there would imply that editing a translation renames everyone's rows —
// which must never happen, and would be a data-loss bug the first time someone
// tried it.
//
// Deliberately free of any Prisma import, so the constants stay usable from a
// Client Component. The write lives in `skill-categories.ts`.

/**
 * The stable identity of a seeded category.
 *
 * A key, not the English name, because the name is the one thing about a
 * category that is guaranteed to change — a Swedish account seeds "Språk", and
 * any account can rename any of them. Anything that needs to recognise a seeded
 * category later matches on this.
 */
export const SEED_CATEGORY_KEYS = [
  "programming",
  "backend",
  "frontend",
  "devops",
  "cloud",
  "tools",
  "language",
  "other",
] as const;

export type SeedCategoryKey = (typeof SEED_CATEGORY_KEYS)[number];

/**
 * The one seeded category that gets `kind: "language"`.
 *
 * `kind` drives the CEFR field in the editor and the CEFR table in the Europass
 * layout. The schema comment on `SkillCategory.kind` already states the intent —
 * that the group can be renamed to "Språk" without breaking either feature —
 * and deriving it from a **key** rather than from an exact match on the English
 * display name is what finally makes that true. The seed function was the one
 * place in the codebase still violating it.
 */
const LANGUAGE_KEY: SeedCategoryKey = "language";

export function seedKind(key: SeedCategoryKey): "language" | "normal" {
  return key === LANGUAGE_KEY ? "language" : "normal";
}

/**
 * `Record<Locale, Record<SeedCategoryKey, string>>` — a third language fails to
 * compile here, and so does a new key, in every locale at once.
 *
 * Order comes from `SEED_CATEGORY_KEYS`, not from the order of these keys, so a
 * translation cannot accidentally reorder a user's category list.
 */
const SEED_NAMES: Record<Locale, Record<SeedCategoryKey, string>> = {
  en: {
    programming: "Programming",
    backend: "Backend",
    frontend: "Frontend",
    // Split out of a single "DevOps & Cloud": the practice and the platform are
    // different things to a reader. "DevOps & Infrastructure" is what you *do* —
    // CI/CD, containers, orchestration, IaC, monitoring, the servers themselves.
    // "Cloud & Edge" is what you deploy *onto* — the providers and their managed,
    // serverless and edge products.
    devops: "DevOps & Infrastructure",
    cloud: "Cloud & Edge",
    tools: "Tools & methods",
    language: "Language",
    other: "Other",
  },
  sv: {
    programming: "Programmering",
    backend: "Backend",
    frontend: "Frontend",
    devops: "DevOps & infrastruktur",
    cloud: "Moln & edge",
    tools: "Verktyg & metoder",
    language: "Språk",
    other: "Övrigt",
  },
};

export type SeedCategory = { key: SeedCategoryKey; name: string; order: number };

/** The rows a new account in this locale should start with, in display order. */
export function seedCategories(locale: string | null | undefined): SeedCategory[] {
  const names = SEED_NAMES[isLocale(locale) ? locale : DEFAULT_LOCALE];
  return SEED_CATEGORY_KEYS.map((key, order) => ({ key, name: names[key], order }));
}

/** How many rows a new account gets — see `MAX_SKILL_CATEGORIES`, which must exceed it. */
export const SEED_CATEGORY_COUNT = SEED_CATEGORY_KEYS.length;

/**
 * A category name → the seeded key it came from, across **every** locale.
 *
 * Every locale, not just the reader's: an account seeded in English and later
 * switched to Swedish still holds English rows, and both should be recognised.
 * A renamed or user-invented category matches nothing, which is correct — it has
 * no seeded identity, and the only caller (the PDF importer's prompt) simply
 * offers it to the model without extra guidance.
 *
 * Lower-cased, because it is matched against user-editable text.
 */
const KEY_BY_NAME: Map<string, SeedCategoryKey> = new Map(
  Object.values(SEED_NAMES).flatMap((names) =>
    SEED_CATEGORY_KEYS.map((key) => [names[key].toLowerCase(), key] as const),
  ),
);

export function seedKeyByName(name: string): SeedCategoryKey | undefined {
  return KEY_BY_NAME.get(name.trim().toLowerCase());
}
