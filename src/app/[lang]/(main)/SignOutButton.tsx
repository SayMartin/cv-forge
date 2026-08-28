"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { localeHref } from "@/i18n/routing";
import { useLocale } from "@/i18n/useLocale";

export function SignOutButton({
  variant = "nav",
}: {
  variant?: "nav" | "page";
}) {
  const router = useRouter();
  const locale = useLocale();
  const { common } = useDictionary();

  async function handleSignOut() {
    localStorage.removeItem("cv_app_user_id");
    await authClient.signOut();
    router.push(localeHref(locale, "/"));
    router.refresh();
  }

  const className =
    variant === "page"
      ? "text-sm text-(--cl-muted) hover:text-(--cl-text) transition-colors cursor-pointer"
      : "text-sm text-[#8FA87A] hover:text-white transition-colors cursor-pointer";

  return (
    <button onClick={handleSignOut} className={className}>
      {common.signOut}
    </button>
  );
}
