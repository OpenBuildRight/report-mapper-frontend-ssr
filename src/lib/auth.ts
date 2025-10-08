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
    async signIn({ user, account, profile }) {
      // On first sign-in, merge NextAuth user with any pre-existing user by Keycloak ID
      if (account && profile && profile.sub) {
        const collection = await (await clientPromise).db().collection('users')

        // Check if a user with this Keycloak ID already exists (pre-created)
        const existingUserById = await collection.findOne({ id: profile.sub })

        if (existingUserById) {
          // User was pre-created with roles, update with real email/name from NextAuth
          await collection.updateOne(
            { id: profile.sub },
            {
              $set: {
                email: user.email,
                name: user.name,
                image: user.image,
                updated_at: new Date()
              }
            }
          )

          // Delete the NextAuth-created duplicate if it exists
          await collection.deleteOne({
            email: user.email,
            id: { $ne: profile.sub }
          })
        } else {
          // No pre-existing user, update the NextAuth-created user with Keycloak ID
          await collection.updateOne(
            { email: user.email },
            {
              $set: {
                id: profile.sub,
                updated_at: new Date()
              },
              $setOnInsert: {
                roles: []
              }
            }
          )
        }
      }
      return true
    },
    async session({ session, user }) {
      // Add user id to session
      if (session.user) {
        // First try to get the user to find their Keycloak ID
        const userDoc = await getUserById(user.id)

        // Use Keycloak sub if available, otherwise fall back to NextAuth id
        const userId = userDoc?.id || user.id
        session.user.id = userId

        // Add roles to session to avoid extra DB queries
        const userRoles = userDoc ? (userDoc.roles as Role[]) : []
        session.user.roles = getAllRoles(userRoles, true, userId)
      }

      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}
