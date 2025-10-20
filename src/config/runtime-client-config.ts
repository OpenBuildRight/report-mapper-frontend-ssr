'use server'

import {config, RuntimeClientConfig} from "@/config/runtime-config";

export async function getRuntimeClientConfig() : Promise<RuntimeClientConfig> {
    return {
        betterAuth: {
            url: config.betterAuth.url,
        }
    }
}
