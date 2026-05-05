import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { betterAuth } from "./routes/_shared";
import { catalogRoutes } from "./routes/catalog";
import { albumRoutes } from "./routes/albums";
import { albumStickerRoutes } from "./routes/album-stickers";

const app = new Elysia()
  .use(betterAuth)
  .use(
    cors({
      origin: process.env.WEB_URL!,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .get("/health", () => ({ status: "ok", timestamp: Date.now() }))
  .use(catalogRoutes)
  .use(albumRoutes)
  .use(albumStickerRoutes)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);

export type App = typeof app;
