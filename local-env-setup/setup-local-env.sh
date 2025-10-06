#!/bin/bash
set -e

echo "🚀 Setting up local development environment..."

# Check if we're in the right directory
if [ ! -f "compose.yaml" ]; then
    echo "❌ Error: compose.yaml not found. Please run this script from the local-env-setup directory."
    exit 1
fi

# Start Keycloak
echo "📦 Starting Keycloak container..."
docker compose up -d

# Wait for Keycloak to be ready
echo "⏳ Waiting for Keycloak to be ready..."
max_attempts=30
attempt=0
while ! curl -s http://localhost:9003/health/ready > /dev/null; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
        echo "❌ Keycloak failed to start after $max_attempts attempts"
        exit 1
    fi
    echo "   Attempt $attempt/$max_attempts..."
    sleep 2
done

echo "✅ Keycloak is ready!"

# Apply Terraform configuration
echo "🔧 Applying Terraform configuration..."
terraform init -upgrade
terraform apply -auto-approve

# Get Terraform outputs
echo "📝 Extracting configuration values..."
KEYCLOAK_CLIENT_SECRET=$(terraform output -raw keycloak_client_secret)
KEYCLOAK_ISSUER=$(terraform output -raw keycloak_issuer)
KEYCLOAK_CLIENT_ID=$(terraform output -raw keycloak_client_id)

# Generate NextAuth secret
echo "🔐 Generating NextAuth secret..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Generate .env.local file in parent directory
ENV_FILE="../.env.local"
echo "📄 Generating $ENV_FILE..."

cat > "$ENV_FILE" << EOF
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# Keycloak Configuration
KEYCLOAK_ISSUER=$KEYCLOAK_ISSUER
KEYCLOAK_CLIENT_ID=$KEYCLOAK_CLIENT_ID
KEYCLOAK_CLIENT_SECRET=$KEYCLOAK_CLIENT_SECRET

# Client-side Keycloak config for logout
NEXT_PUBLIC_KEYCLOAK_ISSUER=$KEYCLOAK_ISSUER

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

# Bootstrap Users Configuration
BOOTSTRAP_USERS_FILE=./local-env-setup/bootstrap-users.yaml
EOF

echo ""
echo "✅ Local development environment setup complete!"
echo ""
echo "📋 Configuration Summary:"
echo "   Keycloak URL: http://localhost:9003"
echo "   Keycloak Admin: kc_admin_user / kc_admin_password"
echo "   Realm: my-realm"
echo "   Client ID: $KEYCLOAK_CLIENT_ID"
echo "   Test User: alice / alice_password"
echo ""
echo "   MongoDB URL: http://localhost:27017"
echo "   MongoDB Database: reportmapper"
echo "   MongoDB Admin: reportmapper / reportmapper_dev_password"
echo "   Mongo Express UI: http://localhost:8081"
echo ""
echo "   MinIO API: http://localhost:9000"
echo "   MinIO Console: http://localhost:9001"
echo "   MinIO Credentials: minio_root_user / minio_root_password"
echo "   Bucket: report-mapper-images"
echo ""
echo "🎯 Next steps:"
echo "   1. Create MinIO bucket (run once):"
echo "      - Visit http://localhost:9001"
echo "      - Login with minio_root_user / minio_root_password"
echo "      - Create bucket named 'report-mapper-images'"
echo "      - Set bucket policy to public (for development)"
echo "   2. cd .."
echo "   3. npm run dev"
echo "   4. Visit http://localhost:3000"
echo ""
