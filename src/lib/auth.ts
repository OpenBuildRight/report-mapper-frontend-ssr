import { NextAuthOptions } from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import { config } from "@/config/env"
import clientPromise from "@/lib/mongodb"

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
      }

      // Get the account to retrieve the access token
      const account = await clientPromise
        .then(client => client.db())
        .then(db => db.collection('accounts').findOne({ userId: user.id }))

      if (account) {
        session.accessToken = account.access_token as string
      }

      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}
