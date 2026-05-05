import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { betterAuth } from "./routes/_shared";
import { catalogRoutes } from "./routes/catalog";
import { albumRoutes } from "./routes/albums";
import { albumStickerRoutes } from "./routes/album-stickers";

const app = new Elysia()
  .use(
    cors({
      origin: process.env.WEB_URL!,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .use(betterAuth)
  .get("/health", () => ({ status: "ok", timestamp: Date.now() }))
  .use(catalogRoutes)
  .use(albumRoutes)
  .use(albumStickerRoutes)
  .listen(Number(process.env.PORT) || 3000);

console.log(`🦊 Elysia escuchando en :${app.server?.port}`);

export default app;
export type App = typeof app;
