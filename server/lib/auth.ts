import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma.js";

const truestedOrigin = process.env.TRUSTED_ORIGINS?.split(',') || []

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    emailAndPassword: {
        enabled: true
    },
    // Enable delete user property
    user: {
        deleteUser: { enabled: true },
        changeEmail: { enabled: true }
    },
    trustedOrigins: truestedOrigin,
    baseURL: process.env.BETTER_AUTH_URL!,
    secret: process.env.BETTER_AUTH_SECRET!,
    advanced: {
        cookiePrefix: "makeMySite",
        cookies: {
            session_token: {
                name: "auth_session",
                attributes: {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: process.env.NODE_ENV === "production" ? 'None' : 'Lax',
                    path: '/'
                }
            }
        }
    }
});