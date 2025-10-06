import { readFileSync, existsSync } from 'fs'
import { parse } from 'yaml'
import { getUserByEmail, createUser } from './users'
import { Role } from '@/types/rbac'
import { getUsersCollection } from './db'

interface BootstrapUser {
  email: string
  name: string
  roles: Role[]
}

interface BootstrapConfig {
  users: BootstrapUser[]
}

/**
 * Load bootstrap configuration from YAML file
 */
function loadBootstrapConfig(): BootstrapConfig | null {
  const configPath = process.env.BOOTSTRAP_USERS_FILE

  if (!configPath) {
    console.log('No BOOTSTRAP_USERS_FILE configured, skipping user bootstrap')
    return null
  }

  console.log(`Loading bootstrap config from: ${configPath}`)

  if (!existsSync(configPath)) {
    console.warn(`Bootstrap config file not found: ${configPath}`)
    return null
  }

  try {
    const fileContents = readFileSync(configPath, 'utf8')
    console.log(`Bootstrap config file contents:\n${fileContents}`)
    const config = parse(fileContents) as BootstrapConfig

    if (!config.users || !Array.isArray(config.users)) {
      console.warn('Invalid bootstrap config: users array not found')
      return null
    }

    console.log(`Found ${config.users.length} users in bootstrap config`)
    return config
  } catch (error) {
    console.error('Error loading bootstrap config:', error)
    return null
  }
}

/**
 * Bootstrap users from configuration file
 * This ensures configured users exist with the correct roles
 */
export async function bootstrapUsers() {
  const config = loadBootstrapConfig()

  if (!config) {
    return
  }

  console.log(`Bootstrapping ${config.users.length} users...`)

  for (const userConfig of config.users) {
    try {
      // Check if user already exists
      let user = await getUserByEmail(userConfig.email)

      if (user) {
        // Update roles if user exists
        const collection = await getUsersCollection()
        await collection.updateOne(
          { email: userConfig.email },
          {
            $set: {
              roles: userConfig.roles,
              name: userConfig.name,
              updated_at: new Date(),
            },
          }
        )
        console.log(`Updated user: ${userConfig.email} with roles: ${userConfig.roles.join(', ')}`)
      } else {
        // Create user if doesn't exist
        user = await createUser({
          email: userConfig.email,
          name: userConfig.name,
        })

        // Set roles
        const collection = await getUsersCollection()
        await collection.updateOne(
          { id: user.id },
          {
            $set: {
              roles: userConfig.roles,
              updated_at: new Date(),
            },
          }
        )
        console.log(`Created user: ${userConfig.email} with roles: ${userConfig.roles.join(', ')}`)
      }
    } catch (error) {
      console.error(`Error bootstrapping user ${userConfig.email}:`, error)
    }
  }

  console.log('User bootstrap complete')
}
