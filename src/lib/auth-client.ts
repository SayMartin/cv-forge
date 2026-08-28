import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import type { Auth } from "@/lib/auth";

// Only import this in client components ("use client" files).
// For server-side auth checks use `auth` from @/lib/auth.
//
// `inferAdditionalFields<Auth>()` is what makes `locale` visible to the client:
// without it `signUp.email({ …, locale })` is a type error and `useSession()`
// hands back a user with no such property. The `Auth` import is type-only, so
// nothing from the server module reaches the browser bundle.
export const authClient = createAuthClient({
  plugins: [adminClient(), inferAdditionalFields<Auth>()],
});

export const { signIn, signOut, signUp, useSession } = authClient;
