"use client";

import type { Locale } from "./config";

/**
 * Tell the server about a deliberate language choice.
 *
 * `keepalive` is the point: both callers change the language by navigating, so
 * the document starts unloading while this request is still in flight. Without
 * it the browser cancels the fetch and the account preference silently never
 * updates — a bug that only shows itself on a *second* device, weeks later.
 *
 * Fire-and-forget, and errors are swallowed on purpose. The cookie is set by
 * `proxy.ts` on the navigation that follows regardless, so the visitor gets the
 * language they asked for either way; only the cross-device memory is lost, and
 * the next toggle or the settings control will fix it. Blocking the navigation
 * on this — or worse, surfacing an error over it — trades a visible failure for
 * an invisible one.
 *
 * Only worth calling for a signed-in user; for a visitor the endpoint has
 * nothing to write and the cookie is already handled.
 */
export function persistLocale(locale: Locale): void {
  void fetch("/api/locale", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locale }),
    keepalive: true,
  }).catch(() => {});
}
