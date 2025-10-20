"use client";

import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // better-auth handles sessions through React hooks, no provider needed
  return <>{children}</>;
}

// Export the auth client for use in components
export { authClient };
