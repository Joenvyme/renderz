import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { nextCookies } from "better-auth/next-js";
import { sendEmail, getVerificationEmailHtml, getResetPasswordEmailHtml } from "./email";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    "https://renderz.ch",
    "https://www.renderz.ch",
    "https://renderz.vercel.app",
    "http://localhost:3000",
  ],
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Envoyer l'email de reset password
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Reset your password - RENDERZ",
        html: getResetPasswordEmailHtml(url, user.name),
        text: `Reset your password by clicking this link: ${url}`,
      });
    },
  },
  // Vérification d'email
  emailVerification: {
    sendOnSignUp: true, // Envoyer l'email de vérification à l'inscription
    autoSignInAfterVerification: true, // Connecter automatiquement après vérification
    sendVerificationEmail: async ({ user, url }) => {
      // Ne pas attendre pour éviter les timing attacks
      void sendEmail({
        to: user.email,
        subject: "Verify your email - RENDERZ",
        html: getVerificationEmailHtml(url, user.name),
        text: `Verify your email by clicking this link: ${url}`,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  plugins: [nextCookies()],
});

