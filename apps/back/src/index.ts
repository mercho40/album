import { Elysia } from "elysia";
import { db } from "./db/drizzle";
import { sticker } from "./db/schema";
import { sql } from "drizzle-orm";
import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

// Better Auth minimal: sin plugins, sin OAuth, sin hooks
const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  baseURL: process.env.BETTER_AUTH_URL,
});

const app = new Elysia()
  .mount(auth.handler)
  .get("/health", () => ({ status: "ok", timestamp: Date.now() }))
  .get("/debug/db", async () => {
    try {
      const r = await db.select({ count: sql<number>`count(*)::int` }).from(sticker);
      return { ok: true, count: r[0]?.count ?? 0 };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  })
  .get("/debug/auth", () => ({ ok: typeof auth.handler === "function" }))
  .get("/", () => "Hello with minimal auth");

if (process.env.VERCEL !== "1") {
  app.listen(3000);
  console.log(`Elysia escuchando en :${app.server?.port}`);
}

export default app;
export type App = typeof app;
