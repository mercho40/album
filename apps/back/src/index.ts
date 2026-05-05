import { Elysia } from "elysia";
import { betterAuth } from "./routes/_shared";
import { catalogRoutes } from "./routes/catalog";
import { albumRoutes } from "./routes/albums";
import { albumStickerRoutes } from "./routes/album-stickers";

const app = new Elysia()
  .use(betterAuth)
  .get("/health", () => ({ status: "ok", timestamp: Date.now() }))
  .use(catalogRoutes)
  .use(albumRoutes)
  .use(albumStickerRoutes);

if (process.env.VERCEL !== "1") {
  app.listen(3000);
  console.log(`Elysia escuchando en :${app.server?.port}`);
}

export default app;
export type App = typeof app;
