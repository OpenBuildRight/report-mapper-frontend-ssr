import {betterAuth} from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { username } from "better-auth/plugins";
import { twoFactor } from "better-auth/plugins";
import { mongoClient, db } from "@/lib/mongodb";
import { getUserRoles } from "@/lib/db/user-roles";

export const auth = betterAuth({
    database: mongodbAdapter(db, {client: mongoClient}),
    baseURL: process.env.NEXTAUTH_URL || "http://localhost:3000",
    secret: process.env.NEXTAUTH_SECRET || "fallback-secret-change-me",
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // Optional email
        minPasswordLength: 8,
    },
    user: {
        // Make email optional
        additionalFields: {
            username: {
                type: "string",
                required: true,
                unique: true,
            }
        }
    },
    plugins: [
        username(), // Enable username-based authentication
        twoFactor({
            issuer: "Report Mapper", // Name shown in authenticator apps
            otpOptions: {
                period: 30,
            }
        })
    ],
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // Update session every 24 hours
    },
    async onSession(session: any) {
        if (session.user) {
            // Add roles to session
            const roles = await getUserRoles(session.user.id);
            return {
                ...session,
                user: {
                    ...session.user,
                    roles,
                }
            };
        }
        return session;
    }
});