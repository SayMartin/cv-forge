"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { localeHref } from "@/i18n/routing";
import { useLocale } from "@/i18n/useLocale";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

/**
 * The app's only internal link.
 *
 * Every page now lives under `/sv/…` or `/en/…`, so a bare `href="/cvs"` would
 * drop the visitor out of their language on every click. Rather than prefix ~30
 * call sites by hand and hope no one adds a bare one later, all of them go
 * through here and keep writing hrefs the way the app is actually organised.
 *
 * Enforced by two checks — see ARCHITECTURE.md → Internationalisation. The first
 * is the load-bearing one: if this file is the only importer of `next/link`,
 * the sole remaining way to emit an un-prefixed internal link is a raw `<a>`.
 *
 *     grep -rln 'from "next/link"' src/app src/components   # only this file
 *
 * Usable from Server Components too — it is a Client Component, but so is
 * `next/link` underneath, so the boundary costs nothing that was not already
 * being paid.
 *
 * `href` is narrowed to `string`; `next/link` also accepts a `UrlObject`, which
 * nothing in this app uses and which `localeHref` would have to special-case.
 */
export function LocaleLink({ href, ...rest }: Props) {
  const locale = useLocale();
  return <Link href={localeHref(locale, href)} {...rest} />;
}
