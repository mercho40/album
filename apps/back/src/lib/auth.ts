import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/drizzle";
import { album } from "../db/schema";
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
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  trustedOrigins: [process.env.WEB_URL!],
  // Cross-subdomain cookies SOLO cuando hay COOKIE_DOMAIN (prod: .mersich.net),
  // para que el front (album.mersich.net) lea la cookie que setea el back
  // (album-back.mersich.net). Sin COOKIE_DOMAIN (dev/E2E en localhost) se dejan
  // host-only: el front las lee entre puertos, y se evita que better-auth derive
  // Domain=localhost (que el browser rechaza → el front no vería la sesión).
  advanced: {
    crossSubDomainCookies: process.env.COOKIE_DOMAIN
      ? { enabled: true, domain: process.env.COOKIE_DOMAIN }
      : { enabled: false },
  },
  // Joined session reads — one query instead of N on getSession.
  experimental: { joins: true },
  session: {
    cookieCache: {
      enabled: true,
      // Cross-origin: el front no propaga Set-Cookie del back, así que el cache no se
      // refresca automáticamente. TTL = duración de la sesión (7 días).
      maxAge: 7 * 24 * 60 * 60,
    },
  },
});
