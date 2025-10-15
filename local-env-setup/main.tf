terraform {
  required_versions = "~> 1.12.0"
  required_providers {
    keycloak = {
      source  = "keycloak/keycloak"
      version = "~> 4.0"
    }
  }
}

provider "keycloak" {
  client_id = "admin-cli"
  username  = "kc_admin_user"
  password  = "kc_admin_password"
  url       = "http://localhost:9003"
}

resource "keycloak_realm" "this" {
  realm   = "my-realm"
  enabled = true
}

resource "keycloak_openid_client" "openid_client" {
  realm_id  = keycloak_realm.this.id
  client_id = "test-client"

  name    = "test client"
  enabled = true

  access_type   = "CONFIDENTIAL"
  client_secret = "local-dev-secret-change-in-production"

  valid_redirect_uris = [
    "http://localhost:3000/api/auth/callback/keycloak",
    "http://127.0.0.1:3000/api/auth/callback/keycloak",
    "http://localhost:3000/oauth2-redirect.html",
    "http://127.0.0.1:3000/oauth2-redirect.html",
    "http://localhost:3001/oauth2-redirect.html",
    "http://127.0.0.1:3001/oauth2-redirect.html",
  ]

  web_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
  ]

  login_theme                  = "keycloak"
  standard_flow_enabled        = true
  implicit_flow_enabled        = false
  direct_access_grants_enabled = false

  extra_config = {
    "key1" = "value1"
    "key2" = "value2"
  }
}

resource "keycloak_user" "user_with_initial_password" {
  realm_id = keycloak_realm.this.id
  username = "alice"
  enabled  = true

  email      = "alice@domain.com"
  first_name = "Alice"
  last_name  = "Aliceberg"


  initial_password {
    value = "alice_password"
  }
}

# Admin user (machine user with all permissions)
resource "keycloak_user" "admin_user" {
  realm_id = keycloak_realm.this.id
  username = "admin"
  enabled  = true

  email      = "admin@example.com"
  first_name = "Admin"
  last_name  = "User"

  initial_password {
    value = "admin_password"
  }
}

output "keycloak_client_secret" {
  value       = keycloak_openid_client.openid_client.client_secret
  description = "Client secret for local development (not sensitive for local env)"
  sensitive   = true
}

output "keycloak_issuer" {
  value       = "http://localhost:9003/realms/${keycloak_realm.this.realm}"
  description = "Keycloak issuer URL"
}

output "keycloak_client_id" {
  value       = keycloak_openid_client.openid_client.client_id
  description = "Keycloak client ID"
}

output "admin_user_id" {
  value       = keycloak_user.admin_user.id
  description = "Admin user UUID (used in ADMIN_USER_ID env var)"
}

output "dev_user_id" {
  value       = keycloak_user.user_with_initial_password.id
  description = "Dev user UUID (alice)"
}