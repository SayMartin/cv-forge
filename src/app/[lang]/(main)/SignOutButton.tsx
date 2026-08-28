"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton({
  variant = "nav",
}: {
  variant?: "nav" | "page";
}) {
  const router = useRouter();

  async function handleSignOut() {
    localStorage.removeItem("cv_app_user_id");
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  const className =
    variant === "page"
      ? "text-sm text-(--cl-muted) hover:text-(--cl-text) transition-colors cursor-pointer"
      : "text-sm text-[#8FA87A] hover:text-white transition-colors cursor-pointer";

  return (
    <button onClick={handleSignOut} className={className}>
      Sign out
    </button>
  );
}
