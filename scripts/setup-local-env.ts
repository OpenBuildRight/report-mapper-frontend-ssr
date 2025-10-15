#!/usr/bin/env node

/**
 * Local Environment Setup Script
 *
 * This script sets up the local development environment by:
 * 1. Starting Docker containers (Keycloak, MongoDB, MinIO)
 * 2. Waiting for Keycloak to be ready
 * 3. Applying Terraform configuration
 * 4. Generating .env.local file with all necessary environment variables
 */

import {spawn, execSync} from 'child_process'
import {writeFileSync, existsSync} from 'fs'
import {resolve} from 'path'
import {randomBytes} from 'crypto'

const SETUP_DIR = resolve(__dirname, '../local-env-setup')
const ENV_FILE = resolve(__dirname, '../.env.local')
const KEYCLOAK_URL = 'http://localhost:9003'
const MAX_ATTEMPTS = 30

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
}

function error(message: string): never {
    console.error(`${colors.red}❌ ${message}${colors.reset}`)
    process.exit(1)
}

function exec(command: string, cwd?: string): string {
    try {
        return execSync(command, {
            cwd: cwd || process.cwd(),
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
        }).trim()
    } catch (err: any) {
        error(`Command failed: ${command}\n${err.message}`)
    }
}

function execVerbose(command: string, cwd?: string): void {
    try {
        execSync(command, {
            cwd: cwd || process.cwd(),
            encoding: 'utf-8',
            stdio: 'inherit',
        })
    } catch (err: any) {
        error(`Command failed: ${command}\n${err.message}`)
    }
}

async function checkKeycloakHealth(): Promise<boolean> {
    try {
        // Just check if Keycloak responds at all (will get 302 redirect)
        const response = await fetch(`${KEYCLOAK_URL}/`)
        return response.status === 302 || response.ok
    } catch {
        return false
    }
}

async function waitForKeycloak(): Promise<void> {
    console.log('Waiting for Keycloak to be ready...')

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const isReady = await checkKeycloakHealth()

        if (isReady) {
            console.log('Keycloak is ready!')
            return
        }

        console.log(`   Attempt ${attempt}/${MAX_ATTEMPTS}...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
    }

    error(`Keycloak failed to start after ${MAX_ATTEMPTS} attempts`)
}

function generateNextAuthSecret(): string {
    return randomBytes(32).toString('base64')
}

async function main() {
    console.log(`${colors.cyan}${colors.bright}🚀 Setting up local development environment...${colors.reset}\n`)

    // Check if we're in the right directory
    if (!existsSync(resolve(SETUP_DIR, 'compose.yaml'))) {
        error('compose.yaml not found in local-env-setup directory')
    }

    // Stop and remove existing containers for clean state
    console.log('Cleaning up existing containers...')
    execVerbose('docker compose down -v', SETUP_DIR)

    // Start Docker containers
    console.log('Starting Docker containers...')
    execVerbose('docker compose up -d', SETUP_DIR)

    // Wait for Keycloak
    await waitForKeycloak()

    // Apply Terraform configuration
    console.log('Applying Terraform configuration...')
    execVerbose('terraform init -upgrade', SETUP_DIR)
    execVerbose('terraform apply -auto-approve', SETUP_DIR)

    // Get Terraform outputs
    console.log('Extracting configuration values...')
    const keycloakClientSecret = exec('terraform output -raw keycloak_client_secret', SETUP_DIR)
    const keycloakIssuer = exec('terraform output -raw keycloak_issuer', SETUP_DIR)
    const keycloakClientId = exec('terraform output -raw keycloak_client_id', SETUP_DIR)
    const adminUserId = exec('terraform output -raw admin_user_id', SETUP_DIR)
    const devUserId = exec('terraform output -raw dev_user_id', SETUP_DIR)

    // Generate NextAuth secret
    console.log('Generating NextAuth secret...')
    const nextAuthSecret = generateNextAuthSecret()

    // Generate .env.local file
    console.log(`Generating ${ENV_FILE}...`)

    const envContent = `# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${nextAuthSecret}

# Keycloak Configuration
KEYCLOAK_ISSUER=${keycloakIssuer}
KEYCLOAK_CLIENT_ID=${keycloakClientId}
KEYCLOAK_CLIENT_SECRET=${keycloakClientSecret}

# Client-side Keycloak config for logout and OAuth2
NEXT_PUBLIC_KEYCLOAK_ISSUER=${keycloakIssuer}
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=${keycloakClientId}

# Backend API Configuration
BACKEND_API_URL=http://localhost:8080

# MongoDB Configuration
MONGODB_URI=mongodb://reportmapper:reportmapper_dev_password@localhost:27017/reportmapper?authSource=admin
MONGODB_DATABASE=reportmapper

# MinIO Configuration
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minio_root_user
MINIO_SECRET_KEY=minio_root_password
MINIO_BUCKET=report-mapper-images
MINIO_USE_SSL=false

# Bootstrap Roles Configuration
# Pre-assign roles to users on first login based on provider and user ID
BOOTSTRAP_ROLES='[{"provider":"keycloak","userId":"${adminUserId}","roles":["security-admin","moderator","validated-user"]},{"provider":"keycloak","userId":"${devUserId}","roles":["security-admin","moderator","validated-user"]}]'
`

    writeFileSync(ENV_FILE, envContent, 'utf-8')
    console.log("Local Env Setup.")

}

main().catch((err) => {
    error(err.message)
})
