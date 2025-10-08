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
import { getUserByEmail, assignRole } from '../src/lib/users'
import { Role } from '../src/types/rbac'
import clientPromise from '../src/lib/mongodb'

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

    // Find alice user by email (created by NextAuth on first login)
    log('🔍', 'Looking for alice user...')
    const alice = await getUserByEmail('alice@domain.com')

    if (!alice) {
      console.log(`${colors.yellow}⚠️  Alice user not found (will be created on first login)${colors.reset}\n`)
      return
    }

    // Assign roles to alice
    log('👤', `Configuring alice (${alice.id})...`)
    await assignRole(alice.id, Role.VALIDATED_USER)
    log('✅', `Assigned role: ${Role.VALIDATED_USER}`)

    await assignRole(alice.id, Role.MODERATOR)
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
