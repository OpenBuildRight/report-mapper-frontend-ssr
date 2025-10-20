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

import { execSync, spawn } from "child_process";
import { randomBytes } from "crypto";
import { existsSync, writeFileSync } from "fs";
import { resolve } from "path";

const SETUP_DIR = resolve(__dirname, "../local-env-setup");
const ENV_FILE = resolve(__dirname, "../.env.local");
const KEYCLOAK_URL = "http://localhost:9003";
const MAX_ATTEMPTS = 30;

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function error(message: string): never {
  console.error(`${colors.red}❌ ${message}${colors.reset}`);
  process.exit(1);
}

function exec(command: string, cwd?: string): string {
  try {
    return execSync(command, {
      cwd: cwd || process.cwd(),
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch (err: any) {
    error(`Command failed: ${command}\n${err.message}`);
  }
}

function execVerbose(command: string, cwd?: string): void {
  try {
    execSync(command, {
      cwd: cwd || process.cwd(),
      encoding: "utf-8",
      stdio: "inherit",
    });
  } catch (err: any) {
    error(`Command failed: ${command}\n${err.message}`);
  }
}

function generateNextAuthSecret(): string {
  return randomBytes(32).toString("base64");
}

async function main() {
  console.log(
    `${colors.cyan}${colors.bright}🚀 Setting up local development environment...${colors.reset}\n`,
  );

  // Check if we're in the right directory
  if (!existsSync(resolve(SETUP_DIR, "compose.yaml"))) {
    error("compose.yaml not found in local-env-setup directory");
  }

  console.log("Docker version.");
  execVerbose("docker version", SETUP_DIR);

  console.log("Docker compose version.");
  execVerbose("docker compose version", SETUP_DIR);

  // Stop and remove existing containers for clean state
  console.log("Cleaning up existing containers...");
  execVerbose("docker compose down -v", SETUP_DIR);

  // Start Docker containers
  console.log("Starting Docker containers...");
  execVerbose("docker compose up -d", SETUP_DIR);

  // Generate NextAuth secret
  console.log("Generating NextAuth secret...");
  const nextAuthSecret = generateNextAuthSecret();

  // Generate .env.local file
  console.log(`Generating ${ENV_FILE}...`);

  const envContent = `# NextAuth Configuration
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=${nextAuthSecret}

# MongoDB Configuration
MONGODB_URI=mongodb://reportmapper:reportmapper_dev_password@localhost:27017/reportmapper?authSource=admin
MONGODB_DATABASE=reportmapper

# MinIO Configuration
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minio_root_user
MINIO_SECRET_KEY=minio_root_password
MINIO_BUCKET=report-mapper-images
MINIO_USE_SSL=false
`;

  writeFileSync(ENV_FILE, envContent, "utf-8");
  console.log("Local Env Setup.");
}

main().catch((err) => {
  error(err.message);
});
