/**
 * Centralized configuration module
 * This is the ONLY module that should read environment variables
 * All configuration is loaded at runtime, not build-time
 */

interface AppConfig {
    // NextAuth Configuration
    nextAuth: {
        url: string
        secret: string
    }

    // Keycloak Configuration
    keycloak: {
        issuer: string
        clientId: string
        clientSecret: string
    }

    // Backend API Configuration
    backend: {
        baseUrl: string
    }

    // Environment
    nodeEnv: string

    mongodb: {
        uri: string
        database: string
    }
}

function getRequiredEnv(key: string): string {
    const value = process.env[key]
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`)
    }
    return value
}

function getOptionalEnv(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue
}

/**
 * Load and validate all configuration at runtime
 * Throws error if required variables are missing
 */
export function getConfig(): AppConfig {
    return {
        nextAuth: {
            url: getRequiredEnv('NEXTAUTH_URL'),
            secret: getRequiredEnv('NEXTAUTH_SECRET'),
        },
        keycloak: {
            issuer: getRequiredEnv('KEYCLOAK_ISSUER'),
            clientId: getRequiredEnv('KEYCLOAK_CLIENT_ID'),
            clientSecret: getRequiredEnv('KEYCLOAK_CLIENT_SECRET'),
        },
        backend: {
            baseUrl: getRequiredEnv('BACKEND_API_URL'),
        },
        nodeEnv: getOptionalEnv('NODE_ENV', 'development'),
        mongodb: {
            uri: getRequiredEnv('MONGODB_URI'),
            database: getOptionalEnv('MONGODB_DATABASE', 'reportmapper')
        }
    }
}

// Export singleton config instance
export const config = getConfig()
