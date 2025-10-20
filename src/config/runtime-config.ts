/**
 * Centralized configuration module
 * This is the ONLY module that should read environment variables
 * All configuration is loaded at runtime, not build-time
 */

interface UserAssignment {
    userId: string;
    roles: string[];
}

interface AppConfig {
    // NextAuth Configuration
    betterAuth: {
        url: string;
        secret: string;
    }

    // Environment
    nodeEnv: string;

    mongodb: {
        uri: string;
        database: string;
    };

    minio: {
        endpoint: string;
        accessKey: string;
        secretKey: string;
        useSSL: boolean;
        imageExpirySeconds: number;
        bucketName: string;
    };
    initialUserRoleAssignments: UserAssignment[]
}

export interface RuntimeClientConfig {
    betterAuth: {
        url: string;
    }
}

function getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

function getOptionalEnv(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

function parseEnv<T>(key: string, defaultValue: T): T {
    const value : string | undefined = process.env[key];
    if (value === undefined) {
        return defaultValue;
    }
    try {
        return JSON.parse(value);
    } catch (error) {
        throw Error(`Failed to parse JSON for environment variable ${key}: ${error}`);
    }
}

/**
 * Load and validate all configuration at runtime
 * Throws error if required variables are missing
 */
export function getConfig(): AppConfig {
    return {
        betterAuth: {
            url: getRequiredEnv("BETTER_AUTH_URL"),
            secret: getRequiredEnv("BETTER_AUTH_SECRET"),
        },
        nodeEnv: getOptionalEnv("NODE_ENV", "development"),
        mongodb: {
            uri: getRequiredEnv("MONGODB_URI"),
            database: getOptionalEnv("MONGODB_DATABASE", "reportmapper"),
        },
        minio: {
            endpoint: getRequiredEnv("MINIO_ENDPOINT"),
            accessKey: getRequiredEnv("MINIO_ACCESS_KEY"),
            secretKey: getRequiredEnv("MINIO_SECRET_KEY"),
            useSSL: getOptionalEnv("MINIO_USE_SSL", "false") === "true",
            imageExpirySeconds: Number(
                getOptionalEnv("MINIO_IMAGE_EXPIRY_SECONDS", "3600"),
            ),
            bucketName: getOptionalEnv("MINIO_BUCKET_NAME", "reportmapper"),
        },
        initialUserRoleAssignments: parseEnv<UserAssignment[]>("INITIAL_USER_ROLES", [])
    }
}

// Export singleton config instance
export const config = getConfig();
