#!/usr/bin/env node

/**
 * Development Server with Initialization
 *
 * This script:
 * 1. Starts the Next.js dev server
 * 2. Waits for MongoDB to be available
 * 3. Sets up dev users with roles directly in the database
 * 4. Keeps the server running
 */

import { spawn } from 'child_process'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load environment variables from .env.local
const ENV_FILE = resolve(__dirname, '../.env.local')
try {
  const envContent = readFileSync(ENV_FILE, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const match = trimmed.match(/^([^=]+)=(.*)$/)
    if (match) {
      process.env[match[1]] = match[2]
    }
  }
} catch {
  console.warn('Warning: Could not load .env.local')
}

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

async function waitForMongoDB(): Promise<boolean> {
  const maxRetries = 10

  for (let i = 0; i < maxRetries; i++) {
    try {
      // Dynamically import to avoid top-level env var check
      const { default: clientPromise } = await import('../src/lib/mongodb')
      await clientPromise
      return true
    } catch {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return false
}

async function initializeDevUsers() {
  console.log(`\n${colors.cyan}${colors.bright}👥 Initializing development users...${colors.reset}\n`)

  try {
    // Wait for MongoDB to be available
    log('⏳', 'Waiting for MongoDB...')
    const mongoReady = await waitForMongoDB()
    if (!mongoReady) {
      console.log(`${colors.yellow}⚠️  MongoDB not ready, skipping user initialization${colors.reset}\n`)
      return
    }
    log('✅', 'MongoDB is ready!')

    // Dynamically import app modules after env vars are loaded
    const { assignRole } = await import('../src/lib/users')
    const { Role } = await import('../src/types/rbac')

    // Get dev user ID from environment variable
    const devUserId = process.env.DEV_USER_ID

    if (!devUserId) {
      console.log(`${colors.yellow}⚠️  DEV_USER_ID not found in environment${colors.reset}\n`)
      return
    }

    log('✅', `Dev user ID: ${devUserId}`)

    // Assign roles to dev user using their user ID
    // assignRole will create the user if they don't exist
    log('👤', 'Configuring dev user roles...')
    await assignRole(devUserId, Role.VALIDATED_USER)
    log('✅', `Assigned role: ${Role.VALIDATED_USER}`)

    await assignRole(devUserId, Role.MODERATOR)
    log('✅', `Assigned role: ${Role.MODERATOR}`)

    console.log(`${colors.green}✅ Development users initialized successfully!${colors.reset}\n`)
  } catch (error) {
    console.error(`${colors.red}❌ Failed to initialize dev users: ${error}${colors.reset}\n`)
  }
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
