import { NextAuthOptions } from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import { config } from "@/config/env"
import clientPromise from "@/lib/mongodb"
import { getUserById } from "@/lib/users"
import { getAllRoles } from "@/lib/rbac"
import { Role } from "@/types/rbac"

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    KeycloakProvider({
      clientId: config.keycloak.clientId,
      clientSecret: config.keycloak.clientSecret,
      issuer: config.keycloak.issuer,
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, user }) {
      // Add user id to session
      if (session.user) {
        session.user.id = user.id

        // Add roles to session to avoid extra DB queries
        const userDoc = await getUserById(user.id)
        if (userDoc) {
          const userRoles = userDoc.roles as Role[]
          session.user.roles = getAllRoles(userRoles, true)
        } else {
          session.user.roles = [Role.PUBLIC]
        }
      }

      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}
