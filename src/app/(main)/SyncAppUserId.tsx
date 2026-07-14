"use client";

import { useEffect } from "react";

// Writes the current app userId to localStorage so the embedded Studio
// (/studio — same origin) can read it directly without going through the
// Sanity email → userMapping chain. Clears it on sign-out (userId null).
export function SyncAppUserId({ userId }: { userId: string | null }) {
  useEffect(() => {
    if (userId) {
      localStorage.setItem("cv_app_user_id", userId);
    } else {
      localStorage.removeItem("cv_app_user_id");
    }
  }, [userId]);

  return null;
}
