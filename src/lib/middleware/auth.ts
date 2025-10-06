import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserRoles } from '@/lib/users'
import { Permission, Role } from '@/types/rbac'
import { hasPermission } from '@/lib/rbac'

export interface AuthContext {
  userId?: string
  roles: Role[]
  isAuthenticated: boolean
}

/**
 * Get authentication context from request
 */
export async function getAuthContext(): Promise<AuthContext> {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return {
      isAuthenticated: false,
      roles: [Role.PUBLIC],
    }
  }

  const userId = session.user.id
  // Use roles from session (cached) instead of querying DB
  const roles = session.user.roles || [Role.PUBLIC]

  return {
    userId,
    roles,
    isAuthenticated: true,
  }
}

/**
 * Require authentication - returns 401 if not authenticated
 */
export async function requireAuth(): Promise<AuthContext> {
  const context = await getAuthContext()

  if (!context.isAuthenticated) {
    throw new UnauthorizedError('Authentication required')
  }

  return context
}

/**
 * Require specific permission - returns 403 if permission not granted
 */
export async function requirePermission(permission: Permission): Promise<AuthContext> {
  const context = await requireAuth()

  if (!hasPermission(context.roles, permission)) {
    throw new ForbiddenError(`Permission required: ${permission}`)
  }

  return context
}

/**
 * Check if current user has permission
 */
export async function checkPermission(permission: Permission): Promise<boolean> {
  const context = await getAuthContext()
  return hasPermission(context.roles, permission)
}

// Custom error classes for better error handling
export class UnauthorizedError extends Error {
  statusCode = 401
  constructor(message: string) {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  statusCode = 403
  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
  }
}

/**
 * Error handler for API routes
 */
export function handleAuthError(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    )
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      { error: error.message },
      { status: 403 }
    )
  }

  // Generic error
  console.error('API Error:', error)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
