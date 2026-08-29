import type { ApiErrorCode } from "@/lib/api-errors";
import type { PluralForms } from "@/i18n/format";

/**
 * What the user reads when a request fails.
 *
 * Keyed by `ApiErrorCode`, so a code added to the API is a compile error in
 * this file and in `sv/errors.ts` until it has words — and `translateApiError`
 * indexing a code the dictionary lacks fails at the lookup rather than
 * rendering nothing.
 *
 * These are not the terse strings in `lib/api-errors.ts`. Those are for a
 * developer reading a network tab; these are for someone who was in the middle
 * of something. So they say what to do next where there is anything to do, and
 * they never name a request, a field key or a status code.
 *
 * A `{ one, other }` pair marks a countable string. Both forms are required, so
 * the Swedish file cannot supply only the plural — see `plural()` in
 * `format.tsx`. The route must send `count` in `params` for these.
 */
export const errors: Record<ApiErrorCode, string | PluralForms> = {
  unauthorized: "You are not signed in any more. Sign in and try again.",
  not_found: "That item no longer exists — it may have been deleted in another tab.",
  invalid_form_data: "The upload could not be read. Please try again.",
  generic: "Something went wrong. Please try again.",

  experience_required: "Company and role are both required.",
  title_required: "A title is required.",
  institution_required: "An institution is required.",
  name_required: "A name is required.",
  profile_name_required: "A profile name is required.",
  cv_name_required: "The CV needs a name.",

  name_too_long: "That name is too long — {max} characters at most.",
  category_exists: "You already have a category with that name.",
  category_limit: {
    one: "You can have at most {count} category.",
    other: "You can have at most {count} categories.",
  },
  // `names` is a comma-joined list of CV names, built by the route. It is user
  // data, so it is passed in rather than described — no translation can help
  // with what someone called their CV.
  category_in_use: {
    one: "Still used by one CV: {names}",
    other: "Still used by {count} CVs: {names}",
  },
  language_category_rename: "The language category cannot be renamed.",
  language_category_delete: "The language category cannot be deleted — rename it instead.",

  unsupported_image_type: "Only JPEG, PNG and WebP images can be uploaded.",
  image_too_large: "That image is larger than {maxMb} MB.",
  avatar_limit: {
    one: "You can keep at most {count} photo.",
    other: "You can keep at most {count} photos.",
  },
  image_upload_failed: "The image could not be uploaded. Please try again.",
  image_save_failed: "The image was uploaded but could not be saved. Please try again.",
  file_required: "Choose a file first.",
  missing_remove_url: "No image was named for removal.",
  image_not_found: "That image is not in your library.",

  pdf_required: "Choose a PDF file.",
  pdf_too_large: "That PDF is larger than {maxMb} MB.",
  pdf_unreadable: "This file could not be read as a PDF. Try exporting it again.",
  // The `one` form is unreachable — a one-page PDF cannot exceed the limit —
  // but `PluralForms` requires it, and a form that has to exist is better
  // written correctly than left as a copy of the plural.
  pdf_too_many_pages: {
    one: "This PDF has {count} page, and imports are limited to {max}. Please upload a shorter CV.",
    other: "This PDF has {count} pages, and imports are limited to {max}. Please upload a shorter CV.",
  },
  // The limit, not the count of what they used — the number the sentence needs
  // is the ceiling. It is a safety cap rather than a rationing decision, so it
  // is worded as a fact about the service, not as a reprimand.
  import_quota_exceeded: {
    one: "You can import {count} CV per day. Please try again later.",
    other: "You can import {count} CVs per day. Please try again later.",
  },
  extraction_failed: "The CV could not be read. Try again, or add the content by hand.",
  import_save_failed: "The imported content could not be saved. Please try again.",

  admin_undeletable: "Admin accounts cannot be deleted from the app.",
  account_delete_failed: "Your data could not be deleted right now. Please try again.",

  invalid_locale: "That language is not supported.",
};
