import { Elysia } from "elysia";

const app = new Elysia()
  .get("/health", () => ({ status: "ok", timestamp: Date.now() }))
  .get("/debug/env", () => ({
    hasDatabaseUrl: typeof process.env.DATABASE_URL === "string",
    hasBetterAuthSecret: typeof process.env.BETTER_AUTH_SECRET === "string",
    hasBetterAuthUrl: typeof process.env.BETTER_AUTH_URL === "string",
    hasWebUrl: typeof process.env.WEB_URL === "string",
    bunVersion: typeof Bun !== "undefined" ? Bun.version : null,
    nodeEnv: process.env.NODE_ENV ?? null,
    vercel: process.env.VERCEL ?? null,
  }))
  .get("/", () => "Hello from Elysia on Vercel");

if (process.env.VERCEL !== "1") {
  app.listen(3000);
  console.log(`Elysia escuchando en :${app.server?.port}`);
}

export default app;
export type App = typeof app;
