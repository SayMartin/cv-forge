import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

// Only import this in client components ("use client" files).
// For server-side auth checks use `auth` from @/lib/auth.
export const authClient = createAuthClient({
  plugins: [adminClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;
