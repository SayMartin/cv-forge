import type { Dictionary } from "../en";

export const errors: Dictionary["errors"] = {
  unauthorized: "Du är inte inloggad längre. Logga in och försök igen.",
  not_found: "Posten finns inte längre — den kan ha raderats i en annan flik.",
  invalid_form_data: "Uppladdningen kunde inte läsas. Försök igen.",
  generic: "Något gick fel. Försök igen.",

  experience_required: "Både företag och roll måste fyllas i.",
  title_required: "En titel måste fyllas i.",
  institution_required: "En skola måste fyllas i.",
  name_required: "Ett namn måste fyllas i.",
  profile_name_required: "Ett profilnamn måste fyllas i.",
  cv_name_required: "CV:t behöver ett namn.",

  name_too_long: "Namnet är för långt — högst {max} tecken.",
  category_exists: "Du har redan en kategori med det namnet.",
  category_limit: {
    one: "Du kan ha högst {count} kategori.",
    other: "Du kan ha högst {count} kategorier.",
  },
  // "CV:n" is the Swedish plural of CV, and the whole reason this string could
  // not stay the `n === 1 ? "CV" : "CVs"` ternary it was written as: the
  // singular and the plural differ by a colon rather than by a suffix, so no
  // amount of concatenating an "s" in JSX would ever have produced it.
  category_in_use: {
    one: "Används fortfarande av ett CV: {names}",
    other: "Används fortfarande av {count} CV:n: {names}",
  },
  language_category_rename: "Språkkategorin kan inte byta namn.",
  language_category_delete: "Språkkategorin kan inte raderas — byt namn på den istället.",

  unsupported_image_type: "Bara JPEG, PNG och WebP går att ladda upp.",
  image_too_large: "Bilden är större än {maxMb} MB.",
  avatar_limit: {
    one: "Du kan ha högst {count} foto.",
    other: "Du kan ha högst {count} foton.",
  },
  image_upload_failed: "Bilden kunde inte laddas upp. Försök igen.",
  image_save_failed: "Bilden laddades upp men kunde inte sparas. Försök igen.",
  file_required: "Välj en fil först.",
  missing_remove_url: "Ingen bild angavs för borttagning.",
  image_not_found: "Bilden finns inte i ditt bildbibliotek.",

  pdf_required: "Välj en PDF-fil.",
  pdf_too_large: "PDF:en är större än {maxMb} MB.",
  pdf_unreadable: "Filen gick inte att läsa som PDF. Prova att exportera den på nytt.",
  pdf_too_many_pages: {
    one: "Den här PDF:en har {count} sida, och import är begränsad till {max}. Ladda upp ett kortare CV.",
    other: "Den här PDF:en har {count} sidor, och import är begränsad till {max}. Ladda upp ett kortare CV.",
  },
  extraction_failed: "CV:t kunde inte tolkas. Försök igen, eller lägg in innehållet för hand.",
  import_save_failed: "Det importerade innehållet kunde inte sparas. Försök igen.",

  admin_undeletable: "Administratörskonton kan inte raderas från appen.",
  account_delete_failed: "Dina uppgifter kunde inte raderas just nu. Försök igen.",

  invalid_locale: "Det språket stöds inte.",
};
