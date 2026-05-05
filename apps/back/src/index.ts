import { Elysia } from "elysia";
import { db } from "./db/drizzle";
import { sticker } from "./db/schema";
import { sql } from "drizzle-orm";

const app = new Elysia()
  .get("/health", () => ({ status: "ok", timestamp: Date.now() }))
  .get("/debug/db", async () => {
    try {
      const r = await db.select({ count: sql<number>`count(*)::int` }).from(sticker);
      return { ok: true, count: r[0]?.count ?? 0 };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  })
  .get("/", () => "Hello with Drizzle");

if (process.env.VERCEL !== "1") {
  app.listen(3000);
  console.log(`Elysia escuchando en :${app.server?.port}`);
}

export default app;
export type App = typeof app;
