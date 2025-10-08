import { NextAuthOptions } from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import { config } from "@/config/env"
import clientPromise from "@/lib/mongodb"
import { getUserRoles, assignRole } from "@/lib/user-roles"
import { getAllRoles } from "@/lib/rbac"
import { Role } from "@/types/rbac"
import { findBootstrapConfig } from "@/lib/bootstrap-roles"

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    KeycloakProvider({
      clientId: config.keycloak.clientId,
      clientSecret: config.keycloak.clientSecret,
      issuer: config.keycloak.issuer,
      profile(profile) {
        // Map Keycloak profile to NextAuth user
        // The 'sub' claim is the Keycloak user ID
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
    }),
  ],
  session: {
    strategy: "database", // Database sessions for security (httpOnly cookies, server-side invalidation)
    maxAge: 60,
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account) return true

      // Check if user matches bootstrap roles configuration
      const bootstrapConfig = findBootstrapConfig(
        account.provider,
        account.providerAccountId
      )

      if (bootstrapConfig && user.id) {
          console.log('Bootstrap roles found for user', user.id, ". Bootstrap config: ", JSON.stringify(bootstrapConfig))
        // Get existing roles for this user
        const existingRoles = await getUserRoles(user.id)

        // Assign any bootstrap roles that user doesn't already have
        for (const role of bootstrapConfig.roles) {
          if (!existingRoles.includes(role)) {
            await assignRole(user.id, role)
          }
        }
      }

      return true
    },
    async session({ session, user }) {
      if (session.user) {
        // Use NextAuth's internal user ID as the canonical identifier
        // This works across all auth providers (Keycloak, Google, etc.)
        session.user.id = user.id

        // Get roles from our separate user_roles table keyed by NextAuth ID
        const userRoles = await getUserRoles(user.id)
        session.user.roles = getAllRoles(userRoles, true, user.id, user.email || undefined)
      }

      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}
