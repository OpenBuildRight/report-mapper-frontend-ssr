#!/usr/bin/env node

/**
 * Development Server with Initialization
 *
 * This script:
 * 1. Starts the Next.js dev server
 * 2. Waits for it to be ready
 * 3. Runs initialization scripts (setup dev users)
 * 4. Keeps the server running
 */

import { spawn } from 'child_process'
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
  gray: '\x1b[90m',
}

function log(emoji: string, message: string) {
  console.log(`${emoji} ${message}`)
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
  } catch {
    return {}
  }
}

async function waitForAPI(): Promise<boolean> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${API_URL}/api/reference`)
      if (response.ok) {
        return true
      }
    } catch {
      // API not ready yet
    }

    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
  }

  return false
}

async function getOAuthToken(
  keycloakIssuer: string,
  clientId: string,
  clientSecret: string,
  username: string,
  password: string
): Promise<string | null> {
  try {
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
      return null
    }

    const data = await response.json()
    return data.access_token
  } catch {
    return null
  }
}

async function assignUserRole(
  token: string,
  userId: string,
  role: string
): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/admin/users/${userId}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    })

    return response.ok
  } catch {
    return false
  }
}

function getUserIdFromToken(token: string): string | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    return payload.sub
  } catch {
    return null
  }
}

async function initializeDevUsers() {
  console.log(`\n${colors.cyan}${colors.bright}👥 Initializing development users...${colors.reset}\n`)

  const env = loadEnv()
  const keycloakIssuer = env.KEYCLOAK_ISSUER || env.NEXT_PUBLIC_KEYCLOAK_ISSUER
  const clientId = env.KEYCLOAK_CLIENT_ID || env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
  const clientSecret = env.KEYCLOAK_CLIENT_SECRET

  if (!keycloakIssuer || !clientId || !clientSecret) {
    console.log(`${colors.yellow}⚠️  Skipping user initialization: Missing Keycloak configuration${colors.reset}\n`)
    return
  }

  // Wait for API to be ready
  log('⏳', 'Waiting for API to be ready...')
  const apiReady = await waitForAPI()
  if (!apiReady) {
    console.log(`${colors.yellow}⚠️  API not ready, skipping user initialization${colors.reset}\n`)
    return
  }
  log('✅', 'API is ready!')

  // Get admin token
  log('🔐', 'Authenticating as admin...')
  const adminToken = await getOAuthToken(keycloakIssuer, clientId, clientSecret, 'admin', 'admin_password')
  if (!adminToken) {
    console.log(`${colors.yellow}⚠️  Could not authenticate as admin, skipping user initialization${colors.reset}\n`)
    return
  }

  // Get alice's user ID
  const aliceToken = await getOAuthToken(keycloakIssuer, clientId, clientSecret, 'alice', 'alice_password')
  if (!aliceToken) {
    console.log(`${colors.yellow}⚠️  Could not authenticate as alice, skipping user initialization${colors.reset}\n`)
    return
  }

  const aliceUserId = getUserIdFromToken(aliceToken)
  if (!aliceUserId) {
    console.log(`${colors.yellow}⚠️  Could not get alice user ID, skipping user initialization${colors.reset}\n`)
    return
  }

  // Assign roles to alice
  log('👤', `Configuring alice (${aliceUserId})...`)
  await assignUserRole(adminToken, aliceUserId, 'validated-user')
  await assignUserRole(adminToken, aliceUserId, 'moderator')

  console.log(`${colors.green}✅ Development users initialized successfully!${colors.reset}\n`)
}

async function main() {
  console.log(`${colors.cyan}${colors.bright}🚀 Starting development server...${colors.reset}\n`)

  // Start Next.js dev server
  const devServer = spawn('next', ['dev', '--turbopack'], {
    stdio: 'inherit',
    shell: true,
  })

  // Handle process termination
  process.on('SIGINT', () => {
    devServer.kill('SIGINT')
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    devServer.kill('SIGTERM')
    process.exit(0)
  })

  devServer.on('exit', (code) => {
    process.exit(code || 0)
  })

  // Initialize dev users in the background
  initializeDevUsers().catch((err) => {
    console.error(`${colors.red}❌ Failed to initialize dev users: ${err.message}${colors.reset}\n`)
  })
}

main()
