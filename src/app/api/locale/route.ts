import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, isLocale, localeCookieOptions } from "@/i18n/config";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeError } from "@/lib/log";

export const dynamic = "force-dynamic";

/**
 * POST /api/locale — record a deliberate language choice.
 *
 * Two stores, and they answer different questions. The cookie is *this device's*
 * language and is what `proxy.ts` reads, since it cannot reach Postgres.
 * `User.locale` is *the account's* language, and is what a fresh sign-in on a
 * new device adopts and what the emails will be written in.
 *
 * Only reached from a deliberate act — the navbar toggle and the settings
 * control. Merely *viewing* a locale does not come through here: the proxy
 * already keeps the cookie in step with the URL, so opening a link somebody sent
 * you in the other language never rewrites your account preference.
 *
 * Body: `{ "locale": "sv" | "en" }`. 204 on success.
 */
export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  const locale =
    body && typeof body === "object" ? (body as { locale?: unknown }).locale : null;

  if (!isLocale(locale)) {
    return NextResponse.json(
      { error: "locale must be one of: sv, en" },
      { status: 400 },
    );
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { locale },
      });
    } catch (error) {
      // Deliberately not fatal. The cookie below is what the visitor actually
      // sees, and it is set either way; failing the whole request would leave
      // them staring at the wrong language because a write they never asked for
      // did not land. The account preference reasserts itself next time.
      console.error("[locale] could not persist account locale:", safeError(error));
    }
  }

  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(
    LOCALE_COOKIE,
    locale,
    localeCookieOptions(request.nextUrl.protocol === "https:"),
  );
  return response;
}
