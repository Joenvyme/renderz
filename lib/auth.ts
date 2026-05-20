import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import {
  sendEmail,
  getVerificationEmailHtml,
  getResetPasswordEmailHtml,
  getOrganizationInvitationEmailHtml,
} from "./email";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/** Génère un slug d'organisation unique pour un nouvel utilisateur. */
async function generatePersonalOrgSlug(seed: string): Promise<string> {
  const base = seed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "workspace";
  // 6 caractères aléatoires pour éviter une collision sans aller chercher en base.
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    "https://renderz.ch",
    "https://www.renderz.ch",
    "https://renderz.vercel.app",
    "http://localhost:3000",
  ],
  database: pool,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Reset your password - RENDERZ",
        html: getResetPasswordEmailHtml(url, user.name),
        text: `Reset your password by clicking this link: ${url}`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
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
  databaseHooks: {
    user: {
      create: {
        // Après création d'un user → on lui crée une organisation perso et on l'y ajoute owner.
        // On utilise le pool postgres directement plutôt que `auth.api.createOrganization`
        // pour éviter d'avoir à fabriquer des headers de session pendant la signup.
        after: async (user) => {
          try {
            const seed = user.name || (user.email?.split("@")[0] ?? "workspace");
            const slug = await generatePersonalOrgSlug(seed);
            const orgId = `org_${user.id}`;
            const memberId = `mbr_${user.id}`;

            await pool.query(
              `INSERT INTO public.organization (id, name, slug, "createdAt")
               VALUES ($1, $2, $3, now())
               ON CONFLICT (id) DO NOTHING`,
              [orgId, `${seed}'s workspace`, slug]
            );

            await pool.query(
              `INSERT INTO public.member (id, "userId", "organizationId", role, "createdAt")
               VALUES ($1, $2, $3, 'owner', now())
               ON CONFLICT (id) DO NOTHING`,
              [memberId, user.id, orgId]
            );
          } catch (err) {
            // On n'empêche pas la signup en cas de problème : le user pourra créer son org plus tard.
            console.error("[auth] auto-create personal organization failed:", err);
          }
        },
      },
    },
    session: {
      create: {
        // Au login, si pas d'organisation active, on prend l'org perso (ou la première dont l'user est membre).
        before: async (session) => {
          try {
            if ((session as { activeOrganizationId?: string | null }).activeOrganizationId) {
              return { data: session };
            }
            const userId = (session as { userId?: string }).userId;
            if (!userId) return { data: session };

            const res = await pool.query<{ organizationId: string }>(
              `SELECT "organizationId"
                 FROM public.member
                WHERE "userId" = $1
                ORDER BY ("organizationId" = $2) DESC, "createdAt" ASC
                LIMIT 1`,
              [userId, `org_${userId}`]
            );

            const activeOrganizationId = res.rows[0]?.organizationId ?? null;
            if (!activeOrganizationId) return { data: session };

            return {
              data: { ...session, activeOrganizationId },
            };
          } catch (err) {
            console.error("[auth] resolve activeOrganizationId failed:", err);
            return { data: session };
          }
        },
      },
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      // Limites volontairement laxistes — on les durcira plus tard si besoin par plan tarifaire.
      organizationLimit: 20,
      membershipLimit: 100,
      invitationExpiresIn: 60 * 60 * 24 * 7, // 7 jours
      // Email d'invitation : lien dédié `/accept-invitation/<id>` (cf. better-auth org plugin).
      sendInvitationEmail: async ({ id, email, inviter, organization, role }) => {
        try {
          const appUrl =
            process.env.BETTER_AUTH_URL ||
            process.env.NEXT_PUBLIC_APP_URL ||
            "https://renderz.ch";
          const inviteUrl = `${appUrl.replace(/\/$/, "")}/accept-invitation/${id}`;
          await sendEmail({
            to: email,
            subject: `Invitation à rejoindre ${organization.name} sur RENDERZ`,
            html: getOrganizationInvitationEmailHtml({
              inviteUrl,
              organizationName: organization.name,
              inviterName: inviter.user?.name ?? null,
              inviterEmail: inviter.user?.email ?? null,
              role: typeof role === "string" ? role : "member",
              recipientEmail: email,
            }),
            text: `Vous êtes invité à rejoindre ${organization.name} sur RENDERZ. Accepter : ${inviteUrl}`,
          });
        } catch (err) {
          console.error("[auth] sendInvitationEmail failed:", err);
        }
      },
    }),
    nextCookies(),
  ],
});

