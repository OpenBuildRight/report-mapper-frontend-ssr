"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { usernameClient } from "better-auth/client/plugins";
import { twoFactorClient } from "better-auth/client/plugins";
import { auth } from "@/lib/auth";

const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    plugins: [
        inferAdditionalFields<typeof auth>(),
        usernameClient(),
        twoFactorClient(),
    ],
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // better-auth handles sessions through React hooks, no provider needed
  return <>{children}</>;
}

// Export the auth client for use in components
export { authClient };
