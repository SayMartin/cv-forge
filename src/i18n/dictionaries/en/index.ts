import { common } from "./common";
import { footer } from "./footer";
import { landing } from "./landing";
import { nav } from "./nav";
import { settings } from "./settings";

/**
 * English is the reference dictionary: its shape *is* the contract, and every
 * other locale is checked against it.
 *
 * **Never add `as const` here.** It would turn each value into a string literal
 * type, so `Dictionary["nav"]["myCvs"]` would be the type `"My CVs"` — and the
 * Swedish file could only satisfy it by containing the English text. Plain
 * inference widens the values to `string`, which is exactly what is wanted:
 * the *keys* are the contract, the words are not.
 */
export const en = { common, footer, landing, nav, settings };

export type Dictionary = typeof en;
