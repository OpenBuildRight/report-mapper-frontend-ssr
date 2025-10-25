"use client";

import { createAuthClient } from "better-auth/react";
import {
    inferAdditionalFields,
    usernameClient,
    twoFactorClient
} from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
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
