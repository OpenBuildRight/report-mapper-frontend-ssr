'use client'

import { createAuthClient } from "better-auth/react";
import {
    inferAdditionalFields,
    usernameClient,
    twoFactorClient
} from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

export const getAuthClient = (baseURL: string) => {
    return createAuthClient({
        baseURL: baseURL,
        plugins: [
            inferAdditionalFields<typeof auth>(),
            usernameClient(),
            twoFactorClient(),
        ],
    });
}

export type AuthClientType = ReturnType<typeof getAuthClient>;
export type Session = ReturnType<AuthClientType["getSession"]>;
