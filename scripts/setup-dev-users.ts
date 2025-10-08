#!/usr/bin/env node

/**
 * Development User Setup Script
 *
 * This script configures development users by:
 * 1. Getting an OAuth token from Keycloak using admin credentials
 * 2. Using the token to call the API and assign roles to users
 * 3. Currently sets up alice with validated-user and moderator roles
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

const ENV_FILE = resolve(__dirname, '../.env.local')
const API_URL = 'http://localhost:3000'
const MAX_RETRIES = 30
const RETRY_DELAY = 2000

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
}

function log(emoji: string, message: string) {
  console.log(`${emoji} ${message}`)
}

function error(message: string): never {
  console.error(`${colors.red}❌ ${message}${colors.reset}`)
  process.exit(1)
}

function loadEnv(): Record<string, string> {
  try {
    const envContent = readFileSync(ENV_FILE, 'utf-8')
    const env: Record<string, string> = {}

    for (const line of envContent.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      const match = trimmed.match(/^([^=]+)=(.*)$/)
      if (match) {
        env[match[1]] = match[2]
      }
    }

    return env
  } catch (err) {
    error(`Failed to load ${ENV_FILE}: ${err}`)
  }
}

async function waitForAPI(): Promise<void> {
  log('⏳', 'Waiting for API to be ready...')

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${API_URL}/api/reference`)
      if (response.ok) {
        log('✅', 'API is ready!')
        return
      }
    } catch {
      // API not ready yet
    }

    console.log(`   Attempt ${attempt}/${MAX_RETRIES}...`)
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
  }

  error(`API failed to start after ${MAX_RETRIES} attempts`)
}

async function getOAuthToken(
  keycloakIssuer: string,
  clientId: string,
  clientSecret: string,
  username: string,
  password: string
): Promise<string> {
  const tokenUrl = `${keycloakIssuer}/protocol/openid-connect/token`

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: clientId,
      client_secret: clientSecret,
      username: username,
      password: password,
      scope: 'openid profile email',
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    error(`Failed to get OAuth token: ${response.status} ${text}`)
  }

  const data = await response.json()
  return data.access_token
}

async function assignUserRole(
  token: string,
  userId: string,
  role: string
): Promise<void> {
  const response = await fetch(`${API_URL}/api/admin/users/${userId}/roles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  })

  if (!response.ok) {
    const text = await response.text()
    error(`Failed to assign role ${role} to user ${userId}: ${response.status} ${text}`)
  }

  log('✅', `Assigned role: ${role}`)
}

async function getUserIdFromToken(token: string): Promise<string> {
  // Decode JWT to get user ID from sub claim
  const parts = token.split('.')
  if (parts.length !== 3) {
    error('Invalid JWT token format')
  }

  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
  return payload.sub
}

async function main() {
  console.log(`${colors.cyan}${colors.bright}👥 Setting up development users...${colors.reset}\n`)

  // Load environment variables
  const env = loadEnv()

  const keycloakIssuer = env.KEYCLOAK_ISSUER || env.NEXT_PUBLIC_KEYCLOAK_ISSUER
  const clientId = env.KEYCLOAK_CLIENT_ID || env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
  const clientSecret = env.KEYCLOAK_CLIENT_SECRET

  if (!keycloakIssuer || !clientId || !clientSecret) {
    error('Missing required environment variables: KEYCLOAK_ISSUER, KEYCLOAK_CLIENT_ID, KEYCLOAK_CLIENT_SECRET')
  }

  // Wait for API to be ready
  await waitForAPI()

  // Get OAuth token for admin user
  log('🔐', 'Authenticating as admin user...')
  const adminToken = await getOAuthToken(
    keycloakIssuer,
    clientId,
    clientSecret,
    'admin',
    'admin_password'
  )
  log('✅', 'Admin authenticated successfully')

  // Get OAuth token for alice to find her user ID
  log('🔍', 'Getting alice user ID...')
  const aliceToken = await getOAuthToken(
    keycloakIssuer,
    clientId,
    clientSecret,
    'alice',
    'alice_password'
  )
  const aliceUserId = await getUserIdFromToken(aliceToken)
  log('✅', `Alice user ID: ${aliceUserId}`)

  // Assign roles to alice using admin token
  log('👤', 'Configuring alice user roles...')
  await assignUserRole(adminToken, aliceUserId, 'validated-user')
  await assignUserRole(adminToken, aliceUserId, 'moderator')

  // Print summary
  console.log(`\n${colors.green}${colors.bright}✅ Development users configured successfully!${colors.reset}\n`)

  console.log(`${colors.cyan}📋 User Configuration:${colors.reset}`)
  console.log(`   alice (${aliceUserId})`)
  console.log(`     - validated-user (can publish own content)`)
  console.log(`     - moderator (can manage all content)`)
  console.log('')
  console.log(`   admin (${env.ADMIN_USER_ID})`)
  console.log(`     - All roles (granted in-memory via ADMIN_USER_ID)`)
  console.log('')
}

main().catch((err) => {
  error(err.message)
})
