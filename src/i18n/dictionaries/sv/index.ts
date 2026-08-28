import type { Dictionary } from "../en";
import { auth } from "./auth";
import { common } from "./common";
import { content } from "./content";
import { cvs } from "./cvs";
import { editor } from "./editor";
import { errors } from "./errors";
import { footer } from "./footer";
import { importPage } from "./importPage";
import { landing } from "./landing";
import { layouts } from "./layouts";
import { nav } from "./nav";
import { settings } from "./settings";

/**
 * Each slice is annotated against its English counterpart in its own file, not
 * only here. That is deliberate: annotating just this object would report a
 * missing key as an error on a four-property literal in *this* file, while the
 * fix belongs three directories away. Per-slice annotation puts
 * "Property 'myCvs' is missing" in `sv/nav.ts`, where it can be acted on.
 *
 * The `satisfies` below is the belt to that pair of braces: it catches a slice
 * that was added to `en/index.ts` but never imported here.
 */
export const sv = {
  auth,
  common,
  content,
  cvs,
  editor,
  errors,
  footer,
  importPage,
  landing,
  layouts,
  nav,
  settings,
} satisfies Dictionary;
