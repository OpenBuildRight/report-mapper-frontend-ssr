# User Bootstrap Configuration

This application supports automatic user bootstrapping via a YAML configuration file. This is useful for:
- Setting up admin users in development environments
- Creating initial users for testing
- Ensuring specific users have required roles across deployments

## How It Works

1. On application startup, after database indexes are created, the system reads the bootstrap configuration file
2. For each user in the config:
   - If the user doesn't exist, it's created with the specified roles
   - If the user exists, their roles and name are updated to match the config
3. This ensures configured users always have the correct permissions

## Configuration

### Environment Variable

Set the path to your bootstrap config file in `.env.local`:

```bash
BOOTSTRAP_USERS_FILE=./bootstrap-users.yaml
```

### Bootstrap Configuration File

Create `bootstrap-users.yaml` in your project root (see `bootstrap-users.example.yaml` for reference):

```yaml
# Bootstrap Users Configuration
users:
  # Admin user - has all permissions
  - email: admin@example.com
    name: Admin User
    roles:
      - SECURITY_ADMIN
      - MODERATOR
      - VALIDATED_USER

  # Moderator user - can review and manage observations
  - email: moderator@example.com
    name: Moderator User
    roles:
      - MODERATOR
      - VALIDATED_USER

  # Regular validated user
  - email: user@example.com
    name: Regular User
    roles:
      - VALIDATED_USER
```

## Available Roles

- `PUBLIC` - Automatically assigned to all users (including unauthenticated)
- `AUTHENTICATED` - Automatically assigned to all authenticated users
- `VALIDATED_USER` - Can create and edit their own observations
- `MODERATOR` - Can review and publish all observations
- `SECURITY_ADMIN` - Can manage users and roles

Note: `PUBLIC` and `AUTHENTICATED` are automatically assigned and don't need to be included in the config.

## Security Considerations

- **Never commit `bootstrap-users.yaml` to version control** - It's in `.gitignore` by default
- Use `bootstrap-users.example.yaml` as a template
- For production, use environment-specific bootstrap files
- Bootstrap users are created when they first authenticate via Keycloak

## Setup Script

The `local-env-setup/setup-local-env.sh` script automatically:
1. Points to `local-env-setup/bootstrap-users.yaml`
2. Sets the `BOOTSTRAP_USERS_FILE` environment variable in `.env.local`

The bootstrap users are committed to the repository in `local-env-setup/bootstrap-users.yaml` and match the users created by Terraform.

## Testing Different Roles

The local development environment creates one test user via Terraform:

1. **Admin User** (alice@domain.com / alice_password):
   - Has all roles: SECURITY_ADMIN, MODERATOR, VALIDATED_USER
   - Can access all routes
   - Can review and publish observations
   - Full security admin capabilities

To test with different permission levels, you can:
- Modify `local-env-setup/bootstrap-users.yaml` to add more users
- Add corresponding users in `local-env-setup/main.tf`
- Or manually create users in Keycloak UI (http://localhost:9003)

## Deployment

For production deployments:

1. Create a production-specific `bootstrap-users.yaml`
2. Set `BOOTSTRAP_USERS_FILE` to point to your production config
3. Ensure the file is accessible to the application
4. Keep the file secure and out of version control

Example for containerized deployment:

```dockerfile
# Copy bootstrap config during build
COPY bootstrap-users.prod.yaml /app/bootstrap-users.yaml

# Or mount as a volume/secret at runtime
```

```bash
# Set environment variable
BOOTSTRAP_USERS_FILE=/app/bootstrap-users.yaml
```
