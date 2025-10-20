'use client'

import {AuthClientType, getAuthClient} from "@/lib/auth-client";
import {useContext, useEffect, useState} from "react";
import {AuthClientContext} from "@/context/AuthClientContext";
import {ClientConfigContext} from "@/context/ClientConfigContext";
import {RuntimeClientConfig} from "@/config/runtime-config";

export const AuthClientProvider : React.FC<{children: React.ReactNode}> = ({children}) => {
    const [client, setClient] = useState<AuthClientType | null>(null);
    const config : RuntimeClientConfig | null = useContext(ClientConfigContext);

    useEffect(
        () => {
            if (config?.betterAuth) {
                setClient(
                    getAuthClient(config.betterAuth.url)
                )
            }
        },
        [config?.betterAuth]
    )

    return (
        <AuthClientContext.Provider value={client}>
            {children}
        </AuthClientContext.Provider>
    )
}