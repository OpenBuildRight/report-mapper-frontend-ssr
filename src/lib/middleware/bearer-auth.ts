import { NextRequest } from 'next/server'
import { jwtVerify, createRemoteJWKSet } from 'jose'
import { config } from '@/config/env'
import { getUserByEmail } from '@/lib/users'
import { getAllRoles } from '@/lib/rbac'
import { Role } from '@/types/rbac'

interface BearerAuthContext {
  userId: string
  email: string
  roles: Role[]
  isAuthenticated: boolean
}

/**
 * Verify OAuth Bearer token from Keycloak
 */
export async function verifyBearerToken(token: string): Promise<BearerAuthContext | null> {
  try {
    // Create JWKS endpoint URL from Keycloak issuer
    const jwksUrl = `${config.keycloak.issuer}/protocol/openid-connect/certs`
    const JWKS = createRemoteJWKSet(new URL(jwksUrl))

    // Verify the JWT signature and claims
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: config.keycloak.issuer,
      audience: config.keycloak.clientId,
    })

    // Extract email from token
    const email = payload.email as string
    if (!email) {
      console.error('No email in token payload')
      return null
    }

    // Get user from database
    const user = await getUserByEmail(email)
    if (!user) {
      console.error(`User not found for email: ${email}`)
      return null
    }

    // Get user roles
    const roles = getAllRoles(user.roles as Role[], true)

    return {
      userId: user.id,
      email: user.email,
      roles,
      isAuthenticated: true,
    }
  } catch (error) {
    console.error('Bearer token verification failed:', error)
    return null
  }
}

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return null
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : null
}
