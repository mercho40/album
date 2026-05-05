import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@back/db/drizzle";
import { album } from "@back/db/schema";
import { admin, organization } from "better-auth/plugins"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  plugins: [
    admin(),
    organization({
      organizationHooks: {
        afterCreateOrganization: async ({ organization: org }) => {
          await db.insert(album).values({
            organizationId: org.id,
            catalogId: "WC2026",
            visibility: "public",
          }).onConflictDoNothing();
        },
      },
    }),
  ],
  emailAndPassword: {
    enabled: true,
  },
  baseURL: process.env.BETTER_AUTH_URL,
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  trustedOrigins: [process.env.WEB_URL!],
  // Joined session reads — one query instead of N on getSession.
  experimental: { joins: true },
  session: {
    cookieCache: {
      enabled: true,
      // Igual que la duración de la sesión real (default Better Auth: 7 días).
      // El hook del web (apps/web/src/hooks.server.ts) lee solo este cache, no
      // revalida contra el back. Si dura menos, el user parece deslogueado al expirar.
      maxAge: 7 * 24 * 60 * 60,
    },
  },
});
