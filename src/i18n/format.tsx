import { Fragment, type ReactNode } from "react";

// Interpolation for dictionary strings.
//
// Every translatable string that varies is written with `{name}` placeholders
// rather than assembled from fragments in JSX. That is not stylistic: a sentence
// split into `…Before` and `…After` keys locks both languages into the same word
// order and the same punctuation, and Swedish obliges neither. The one sentence
// on the landing page that wraps an inline <strong> reads "…from Settings and
// every piece…" in English but "…under Inställningar, så…" in Swedish — a comma
// that has nowhere to live in a fixed `After` fragment.
//
// The placeholder syntax is deliberately minimal: a name in braces, no format
// specifiers, no nesting. Anything more elaborate is a sign the string wants
// splitting into two keys instead.

const NAME = "[a-zA-Z0-9_]+";

// Three regexes rather than one, because they need different capture shapes:
// `replace` wants the name captured, `split` must capture the whole token and
// nothing else (a nested group would interleave a second value into the result).
// All are safe to share across calls — `replace` and `split` do not carry
// `lastIndex` between invocations the way `exec`/`test` do.
const REPLACE = new RegExp(`\\{(${NAME})\\}`, "g");
const SPLIT = new RegExp(`(\\{${NAME}\\})`, "g");
const EXACT = new RegExp(`^\\{(${NAME})\\}$`);

/**
 * `format("Switch to {language}", { language: "svenska" })`.
 *
 * An unknown placeholder is left in place rather than replaced with `undefined`,
 * so a typo surfaces as a visible `{language}` instead of silently vanishing.
 */
export function format(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(REPLACE, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole,
  );
}

/**
 * `format`, but the values are React nodes — a link, a `<strong>`, a number in
 * its own span. The template is rendered with each placeholder replaced in
 * place, so the *translation* decides where the markup falls in the sentence.
 *
 *     <RichText
 *       template={d.landing.data.privacyBody}       // "… spelled out in the {privacyPolicy}."
 *       values={{ privacyPolicy: <LocaleLink href="/privacy">…</LocaleLink> }}
 *     />
 *
 * Pure and directive-free, so it renders on the server as well as the client.
 */
export function RichText({
  template,
  values,
}: {
  template: string;
  values: Record<string, ReactNode>;
}) {
  // The capturing group makes `split` keep the delimiters, so the result
  // alternates literal text and `{placeholder}` tokens.
  const parts = template.split(SPLIT);

  return (
    <>
      {parts.map((part, i) => {
        const name = EXACT.exec(part)?.[1];
        const value = name === undefined ? undefined : values[name];
        return <Fragment key={i}>{value ?? part}</Fragment>;
      })}
    </>
  );
}
