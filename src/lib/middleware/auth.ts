import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { type Permission, Role } from "@/types/rbac";
import { extractBearerToken, verifyBearerToken } from "./bearer-auth";
import {hasPermission} from "@/lib/rbac/permissions";

export interface AuthContext {
  userId?: string;
  roles: Role[];
  isAuthenticated: boolean;
  authMethod?: "session" | "bearer";
}

/**
 * Get authentication context from request
 * Supports both session cookies (browser) and OAuth bearer tokens (API)
 */
export async function getAuthContext(
  request?: Request | NextRequest,
): Promise<AuthContext> {
  // First, try bearer token authentication (for API access)
  if (request) {
    const bearerToken = extractBearerToken(request);
    if (bearerToken) {
      const bearerAuth = await verifyBearerToken(bearerToken);
      if (bearerAuth) {
        return {
          ...bearerAuth,
          authMethod: "bearer",
        };
      }
      // Invalid bearer token - fall through to session check
    }
  }

  // Fall back to session authentication (for browser)
  const session = request ? await auth.api.getSession({
    headers: request.headers,
  }) : null;

  if (!session || !session.user) {
    return {
      isAuthenticated: false,
      roles: [Role.PUBLIC],
    };
  }

  const userId = session.user.id;
  // Use roles from session (cached) instead of querying DB
  const roles = (session.user as any).roles || [Role.PUBLIC];

  return {
    userId,
    roles,
    isAuthenticated: true,
    authMethod: "session",
  };
}

/**
 * Require authentication - returns 401 if not authenticated
 */
export async function requireAuth(
  request?: Request | NextRequest,
): Promise<AuthContext> {
  const context = await getAuthContext(request);

  if (!context.isAuthenticated) {
    throw new UnauthorizedError("Authentication required");
  }

  return context;
}

/**
 * Require specific permission - returns 403 if permission not granted
 */
export async function requirePermission(
  permission: Permission,
  request?: Request | NextRequest,
): Promise<AuthContext> {
  const context = await requireAuth(request);

  if (!hasPermission(context.roles, permission)) {
    throw new ForbiddenError(`Permission required: ${permission}`);
  }

  return context;
}

/**
 * Check if current user has permission
 */
export async function checkPermission(
  permission: Permission,
  request?: Request | NextRequest,
): Promise<boolean> {
  const context = await getAuthContext(request);
  return hasPermission(context.roles, permission);
}

// Custom error classes for better error handling
export class UnauthorizedError extends Error {
  statusCode = 401;
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Error handler for API routes
 */
export function handleAuthError(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  // Generic error
  console.error("API Error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
