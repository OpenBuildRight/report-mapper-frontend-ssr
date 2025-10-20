import {betterAuth} from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { username } from "better-auth/plugins";
import { twoFactor } from "better-auth/plugins";
import { mongoClient, db } from "@/lib/mongodb";
import { getUserRoles } from "@/lib/db/user-roles";

// Helper function to check if email is a dummy email
export const isDummyEmail = (email: string): boolean => {
    return email.endsWith("@local.username");
};

export const auth = betterAuth({
    database: mongodbAdapter(db, {client: mongoClient}),
    baseURL: process.env.NEXTAUTH_URL || "http://localhost:3000",
    secret: process.env.NEXTAUTH_SECRET || "fallback-secret-change-me",
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // Don't block login for unverified emails
        minPasswordLength: 8,
    },
    emailVerification: {
        async sendVerificationEmail(data, request) {
            // Only send verification emails for real emails, not dummy ones
            if (isDummyEmail(data.user.email)) {
                return; // Skip sending verification for dummy emails
            }

            // TODO: Implement actual email sending here using your email service
            // Examples: SendGrid, Resend, Nodemailer, etc.
            // For now, we log to console for development
            console.log(`[Email Verification] Send to: ${data.user.email}`);
            console.log(`[Email Verification] URL: ${data.url}`);
            console.log(`[Email Verification] Token: ${data.token}`);

            // Example implementation with Resend:
            // await resend.emails.send({
            //     from: 'noreply@yourdomain.com',
            //     to: data.user.email,
            //     subject: 'Verify your email',
            //     html: `Click here to verify: <a href="${data.url}">${data.url}</a>`
            // });
        },
        sendOnSignUp: true, // Send verification email when user signs up with real email
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