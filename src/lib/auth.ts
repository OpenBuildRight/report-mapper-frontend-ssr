import {MongoDBAdapter} from "@auth/mongodb-adapter";
import type {NextAuthOptions} from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import {config} from "@/config/runtime-config";
import {findBootstrapConfig} from "@/lib/bootstrap-roles";
import clientPromise from "@/lib/mongodb";
import {assignRole, getUserRoles} from "@/lib/db/user-roles";
import {getAllRoles} from "@/lib/rbac/server-session-user-roles";

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
                    username: profile.preferred_username
                };
            },
        }),
    ],
    session: {
        strategy: "database", // Database sessions for security (httpOnly cookies, server-side invalidation)
        maxAge: 60,
    },
    callbacks: {
        async signIn({user, account}) {
            if (!account) return true;

            // Check if user matches bootstrap roles configuration
            const bootstrapConfig = findBootstrapConfig(
                account.provider,
                account.providerAccountId,
            );

            if (bootstrapConfig && user.id) {
                console.log(
                    "Bootstrap roles found for user",
                    user.id,
                    ". Bootstrap config: ",
                    JSON.stringify(bootstrapConfig),
                );
                // Get existing roles for this user
                const existingRoles = await getUserRoles(user.id);

                // Assign any bootstrap roles that user doesn't already have
                for (const role of bootstrapConfig.roles) {
                    if (!existingRoles.includes(role)) {
                        await assignRole(user.id, role);
                    }
                }
            }

            return true;
        },
        async session({session, user}) {
            if (session.user) {
                // Use NextAuth's internal user ID as the canonical identifier
                // This works across all auth providers (Keycloak, Google, etc.)
                session.user.id = user.id;

                // Get roles from our separate user_roles table keyed by NextAuth ID
                session.user.roles = await getAllRoles(
                    user.id,
                );
            }

            return session;
        },
    },
    pages: {
        signIn: "/auth/signin",
    },
};
