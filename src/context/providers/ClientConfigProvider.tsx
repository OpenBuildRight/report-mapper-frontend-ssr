'use client'

import {useEffect, useState} from "react";
import {RuntimeClientConfig} from "@/config/runtime-config";
import {ClientConfigContext} from "@/context/ClientConfigContext";
import {getRuntimeClientConfig} from "@/config/runtime-client-config";



export const ClientConfigProvider : React.FC<{children: React.ReactNode}> = ({children}) => {
    const [clientConfig, setClientConfig] = useState<RuntimeClientConfig | null>(null)

    useEffect(() => {
        getRuntimeClientConfig().then(c => setClientConfig(c))
    }, [])

    return (
        <ClientConfigContext value={clientConfig}>
            {children}
        </ClientConfigContext>
    )
}