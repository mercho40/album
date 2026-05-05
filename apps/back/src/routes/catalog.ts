import { Elysia, t } from "elysia";
import { db } from "../db/drizzle";
import { sticker } from "../db/schema";
import { eq, asc } from "drizzle-orm";

export const catalogRoutes = new Elysia({ prefix: "/catalog" })
  .get(
    "/:catalogId/stickers",
    async ({ params, set }) => {
      const rows = await db
        .select()
        .from(sticker)
        .where(eq(sticker.catalogId, params.catalogId))
        .orderBy(asc(sticker.createdAt));

      set.headers["cache-control"] = "public, max-age=3600";
      return rows;
    },
    {
      params: t.Object({ catalogId: t.String() }),
    },
  )
  .get(
    "/:catalogId/stickers/:stickerId",
    async ({ params, status }) => {
      const [row] = await db
        .select()
        .from(sticker)
        .where(eq(sticker.id, params.stickerId))
        .limit(1);

      if (!row || row.catalogId !== params.catalogId) {
        return status(404, {
          error: { code: "STICKER_NOT_FOUND", message: "Sticker not found" },
        });
      }
      return row;
    },
    {
      params: t.Object({
        catalogId: t.String(),
        stickerId: t.String(),
      }),
    },
  );
