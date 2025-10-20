import { createRemoteJWKSet, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { config } from "@/config/runtime-config";
import { mongoClient, db } from "@/lib/mongodb";
import type { Role } from "@/types/rbac";
import {getAllRoles} from "@/lib/rbac/server-session-user-roles";

interface BearerAuthContext {
  userId: string;
  email: string;
  roles: Role[];
  isAuthenticated: boolean;
}

/**
 * Verify OAuth Bearer token from Keycloak
 */
export async function verifyBearerToken(
  token: string,
): Promise<BearerAuthContext | null> {
  try {
    // Create JWKS endpoint URL from Keycloak issuer
    const jwksUrl = `${config.keycloak.issuer}/protocol/openid-connect/certs`;
    const JWKS = createRemoteJWKSet(new URL(jwksUrl));

    // Verify the JWT signature and claims
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: config.keycloak.issuer,
      audience: config.keycloak.clientId,
    });

    // Extract Keycloak user ID from sub claim
    const keycloakSub = payload.sub as string;
    if (!keycloakSub) {
      console.error("No sub claim in token payload");
      return null;
    }

    // Extract email (optional, for display/logging)
    const email = payload.email as string;

    // Map Keycloak sub to NextAuth user ID via accounts table
    const account = (await db.collection("accounts").findOne({
      provider: "keycloak",
      providerAccountId: keycloakSub,
    })) as any;

    if (!account) {
      console.error(
        `No NextAuth account found for Keycloak sub: ${keycloakSub}`,
      );
      return null;
    }

    const nextAuthUserId = account.userId.toString();

    const roles = await getAllRoles(nextAuthUserId);

    return {
      userId: nextAuthUserId,
      email: email,
      roles,
      isAuthenticated: true,
    };
  } catch (error) {
    console.error("Bearer token verification failed:", error);
    return null;
  }
}

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(
  request: Request | NextRequest,
): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return null;
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}
