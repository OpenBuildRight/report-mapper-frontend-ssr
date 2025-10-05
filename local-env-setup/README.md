# Local Development Environment Setup

This directory contains the configuration for setting up a local Keycloak instance for development.

## Prerequisites

- Docker and Docker Compose
- Terraform
- OpenSSL (for generating secrets)

## Quick Start

Run the automated setup script:

```bash
cd local-env-setup
./setup-local-env.sh
```

This script will:
1. Start Keycloak in Docker
2. Wait for Keycloak to be ready
3. Apply Terraform configuration to set up realm, client, and test user
4. Extract configuration values from Terraform outputs
5. Generate a secure NextAuth secret
6. Create `.env.local` file in the project root with all configuration

## Manual Setup

If you prefer to set up manually:

### 1. Start Keycloak

```bash
docker compose up -d
```

### 2. Apply Terraform Configuration

```bash
terraform init
terraform apply
```

### 3. Get Configuration Values

```bash
terraform output
```

### 4. Create .env.local

Copy the values from Terraform outputs to create `.env.local` in the project root:

```bash
# Use .env.local.example as a template
cp ../.env.local.example ../.env.local
```

Then update with the actual values from Terraform outputs.

## Configuration Details

### Keycloak
- **URL**: http://localhost:9003
- **Admin User**: `kc_admin_user`
- **Admin Password**: `kc_admin_password`
- **Realm**: `my-realm`
- **Client ID**: `test-client`
- **Client Secret**: `local-dev-secret-change-in-production`

### MongoDB
- **URL**: http://localhost:27017
- **Database**: `reportmapper`
- **Admin User**: `reportmapper`
- **Admin Password**: `reportmapper_dev_password`
- **Mongo Express UI**: http://localhost:8081

### Test User
- **Username**: `alice`
- **Password**: `alice_password`
- **Email**: alice@domain.com

## Stopping the Environment

```bash
docker compose down
```

## Resetting the Environment

To completely reset:

```bash
docker compose down -v
terraform destroy
./setup-local-env.sh
```

## Security Notes

⚠️ **This configuration is for LOCAL DEVELOPMENT ONLY**

- The client secret is hardcoded for repeatability
- Credentials are simple and well-known
- The `.env.local` file is git-ignored
- Never use this configuration in production
