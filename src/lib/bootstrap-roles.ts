import { Role } from '@/types/rbac'
import { z } from 'zod'

/**
 * Bootstrap role configuration for pre-assigning roles on first login
 *
 * Set BOOTSTRAP_ROLES environment variable to a JSON array:
 * [
 *   {
 *     "provider": "keycloak",
 *     "userId": "9f39c9e4-9de5-445e-834d-7de57a07f985",
 *     "roles": ["SECURITY_ADMIN", "MODERATOR", "VALIDATED_USER"]
 *   },
 *   {
 *     "provider": "credentials",
 *     "userId": "admin",
 *     "roles": ["SECURITY_ADMIN", "MODERATOR"]
 *   }
 * ]
 *
 * On first login, if the user's provider and provider user ID match a config entry,
 * those roles will be assigned to their NextAuth user ID.
 *
 * Once roles are assigned, removing the env var has no effect (roles persist in DB).
 */

const bootstrapRoleConfigSchema = z.object({
  provider: z.string(),
  userId: z.string(),
  roles: z.array(z.nativeEnum(Role)),
})

export type BootstrapRoleConfig = z.infer<typeof bootstrapRoleConfigSchema>

const bootstrapRolesArraySchema = z.array(bootstrapRoleConfigSchema)

let cachedConfig: BootstrapRoleConfig[] | null = null

/**
 * Get bootstrap roles configuration from environment variable
 * Parses and validates BOOTSTRAP_ROLES JSON string
 * Results are cached in memory
 */
export function getBootstrapRolesConfig(): BootstrapRoleConfig[] {
  if (cachedConfig !== null) {
    return cachedConfig
  }

  const envValue = process.env.BOOTSTRAP_ROLES
  if (!envValue) {
    cachedConfig = []
    return cachedConfig
  }

  try {
    const parsed = JSON.parse(envValue)
    const validated = bootstrapRolesArraySchema.parse(parsed)
    cachedConfig = validated
    return cachedConfig
  } catch (error) {
    console.error('Failed to parse BOOTSTRAP_ROLES:', error)
    cachedConfig = []
    return cachedConfig
  }
}

/**
 * Find matching bootstrap config for a user
 */
export function findBootstrapConfig(
  provider: string,
  providerUserId: string
): BootstrapRoleConfig | undefined {
  const configs = getBootstrapRolesConfig()
  return configs.find(
    (config) => config.provider === provider && config.userId === providerUserId
  )
}
