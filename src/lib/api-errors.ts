import { NextResponse } from "next/server";

/**
 * The failure vocabulary of this app's API.
 *
 * Every route handler answers a failure with one of these codes rather than an
 * English sentence, because a sentence written in a Route Handler cannot be
 * translated: handlers cannot read `next/root-params`, so a route has no idea
 * which language the page that called it is rendering in. The code travels, and
 * the *client* — which does know — turns it into words through
 * `translateApiError`.
 *
 * Adding a code here is a compile error in both dictionaries until it is
 * translated, because `errors` is typed `Record<ApiErrorCode, …>`.
 *
 * These strings are stored nowhere and returned to nobody but this app's own
 * client, so renaming one is safe in a way that renaming a `layoutId` is not.
 */
export const API_ERROR_CODES = [
  // Shared by nearly every route.
  "unauthorized",
  "not_found",
  "invalid_form_data",
  /** Last resort: the client shows this when it meets a code it does not know. */
  "generic",

  // Required fields. One code per field rather than a single `field_required`
  // with a `{field}` parameter: the parameter would have to carry a field
  // *name*, which is itself a translatable string the API cannot translate —
  // and "Företag krävs" reads like a machine where "Företag och roll måste båda
  // fyllas i" reads like a sentence.
  "experience_required",
  "title_required",
  "institution_required",
  "name_required",
  "profile_name_required",
  "cv_name_required",

  // Skill categories.
  "name_too_long",
  "category_exists",
  "category_limit",
  "category_in_use",
  "language_category_rename",
  "language_category_delete",

  // Photos.
  "unsupported_image_type",
  "image_too_large",
  "avatar_limit",
  "image_upload_failed",
  "image_save_failed",
  "file_required",
  "missing_remove_url",
  "image_not_found",

  // PDF import.
  "pdf_required",
  "pdf_too_large",
  "pdf_unreadable",
  "pdf_too_many_pages",
  "import_quota_exceeded",
  "extraction_failed",
  "import_save_failed",

  // Account.
  "admin_undeletable",
  "account_delete_failed",

  // Locale.
  "invalid_locale",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/** Values a `{placeholder}` in an error string can be filled with. */
export type ApiErrorParams = Record<string, string | number>;

/**
 * The body every failed request answers with.
 *
 * `error` is **diagnostic, not user-facing.** It exists so a failed request is
 * readable in the network tab and in `curl` without a code lookup, and it is
 * deliberately terse and permanently English. The client never renders it — see
 * `translateApiError` for why.
 */
export type ApiErrorBody = {
  code: ApiErrorCode;
  error: string;
  params?: ApiErrorParams;
};

/**
 * The English half of the wire format — terse, for a human reading a log.
 *
 * Kept here rather than read from `dictionaries/en/errors.ts` on purpose.
 * Reading it there would make `lib/` import `i18n/`, which imports `lib/` back
 * for `ApiErrorCode`; the cycle survives only because that import is
 * type-only, and a cycle held together by an `import type` is a trap for
 * whoever next needs a value from it. Two English strings that may drift is the
 * cheaper problem, because *this* one is never shown to anybody.
 */
const DIAGNOSTIC: Record<ApiErrorCode, string> = {
  unauthorized: "Unauthorized",
  not_found: "Not found",
  invalid_form_data: "Invalid form data",
  generic: "Request failed",

  experience_required: "company and role are required",
  title_required: "title is required",
  institution_required: "institution is required",
  name_required: "name is required",
  profile_name_required: "profileName is required",
  cv_name_required: "name is required",

  name_too_long: "name is too long",
  category_exists: "category already exists",
  category_limit: "too many categories",
  category_in_use: "category still used by a CV",
  language_category_rename: "the language category cannot be renamed",
  language_category_delete: "the language category cannot be deleted",

  unsupported_image_type: "unsupported image type",
  image_too_large: "image too large",
  avatar_limit: "too many photos",
  image_upload_failed: "image upload failed",
  image_save_failed: "image record could not be saved",
  file_required: "a file is required",
  missing_remove_url: "missing 'remove' URL",
  image_not_found: "image not found",

  pdf_required: "a PDF file is required",
  pdf_too_large: "PDF too large",
  pdf_unreadable: "file could not be read as a PDF",
  pdf_too_many_pages: "PDF has too many pages",
  import_quota_exceeded: "import quota exceeded",
  extraction_failed: "AI extraction failed",
  import_save_failed: "failed to save imported content",

  admin_undeletable: "admin accounts cannot be deleted from the application",
  account_delete_failed: "could not delete user data",

  invalid_locale: "locale must be one of: sv, en",
};

/**
 * `return apiError("not_found", 404);`
 *
 * `params` fills the `{placeholders}` in the translated string on the client.
 * **A code whose translation is a `PluralForms` pair must pass `count`** — that
 * is the number the plural rule is selected on. `pdf_too_many_pages` counts
 * pages and carries `max` alongside; `category_limit` counts the limit itself.
 */
export function apiError(
  code: ApiErrorCode,
  status: number,
  params?: ApiErrorParams,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { code, error: DIAGNOSTIC[code], ...(params ? { params } : {}) },
    { status },
  );
}
