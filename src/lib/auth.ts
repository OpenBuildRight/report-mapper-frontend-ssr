import { NextAuthOptions } from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import { config } from "@/config/env"
import clientPromise from "@/lib/mongodb"
import { getUserRoles } from "@/lib/user-roles"
import { getAllRoles } from "@/lib/rbac"
import { Role } from "@/types/rbac"

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
    maxAge: 60, // 30 days
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        // The user.id from NextAuth is the Keycloak sub via profile mapping
        session.user.id = user.id

        // Get roles from our separate user_roles table
        // Performance: 2 DB queries per request (session + roles)
        // Trade-off: Better security (session IDs) and immediate role updates
        const userRoles = await getUserRoles(user.id)
        session.user.roles = getAllRoles(userRoles, true, user.id)
      }

      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}
