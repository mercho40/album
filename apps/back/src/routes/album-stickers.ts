import { Elysia, t } from "elysia";
import { db } from "@back/db/drizzle";
import { album, albumSticker, organization, member, sticker } from "@back/db/schema";
import { auth } from "@back/lib/auth";
import { betterAuth } from "./_shared";
import { and, eq, sql } from "drizzle-orm";

const EDITOR_ROLES = ["owner", "admin", "editor"] as const;

async function loadAlbumBySlug(slug: string) {
  const [row] = await db
    .select({
      id: organization.id,
      visibility: album.visibility,
      catalogId: album.catalogId,
    })
    .from(album)
    .innerJoin(organization, eq(organization.id, album.organizationId))
    .where(eq(organization.slug, slug))
    .limit(1);
  return row;
}

async function userRoleInAlbum(albumId: string, userId: string) {
  const [m] = await db
    .select({ role: member.role })
    .from(member)
    .where(and(eq(member.organizationId, albumId), eq(member.userId, userId)))
    .limit(1);
  return m?.role ?? null;
}

export const albumStickerRoutes = new Elysia({ prefix: "/albums" })
  .use(betterAuth)
  .get(
    "/:slug/stickers",
    async ({ params, request, status }) => {
      const a = await loadAlbumBySlug(params.slug);
      if (!a) {
        return status(404, { error: { code: "ALBUM_NOT_FOUND", message: "Álbum no encontrado" } });
      }

      if (a.visibility === "private") {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) return status(404, { error: { code: "ALBUM_NOT_FOUND", message: "Álbum no encontrado" } });
        const role = await userRoleInAlbum(a.id, session.user.id);
        if (!role) return status(404, { error: { code: "ALBUM_NOT_FOUND", message: "Álbum no encontrado" } });
      }

      const rows = await db
        .select({
          stickerId: sticker.id,
          number: sticker.number,
          playerName: sticker.playerName,
          team: sticker.team,
          type: sticker.type,
          imageUrl: sticker.imageUrl,
          count: sql<number>`COALESCE(${albumSticker.count}, 0)`.as("count"),
        })
        .from(sticker)
        .leftJoin(
          albumSticker,
          and(eq(albumSticker.stickerId, sticker.id), eq(albumSticker.albumId, a.id)),
        )
        .where(eq(sticker.catalogId, a.catalogId))
        .orderBy(sticker.createdAt);

      return rows;
    },
    { params: t.Object({ slug: t.String() }) },
  )
  .patch(
    "/:slug/stickers/:stickerId",
    async ({ params, body, user, status }) => {
      const a = await loadAlbumBySlug(params.slug);
      if (!a) {
        return status(404, { error: { code: "ALBUM_NOT_FOUND", message: "Álbum no encontrado" } });
      }

      const role = await userRoleInAlbum(a.id, user.id);
      if (!role || !EDITOR_ROLES.includes(role as (typeof EDITOR_ROLES)[number])) {
        return status(403, {
          error: { code: "INSUFFICIENT_PERMISSIONS", message: "No podés editar este álbum" },
        });
      }

      const [s] = await db
        .select({ id: sticker.id })
        .from(sticker)
        .where(and(eq(sticker.id, params.stickerId), eq(sticker.catalogId, a.catalogId)))
        .limit(1);
      if (!s) {
        return status(404, {
          error: { code: "STICKER_NOT_IN_CATALOG", message: "Figurita no pertenece al catálogo" },
        });
      }

      await db
        .insert(albumSticker)
        .values({
          albumId: a.id,
          stickerId: params.stickerId,
          count: body.count,
        })
        .onConflictDoUpdate({
          target: [albumSticker.albumId, albumSticker.stickerId],
          set: { count: body.count },
        });

      return { stickerId: params.stickerId, count: body.count };
    },
    {
      auth: true,
      params: t.Object({
        slug: t.String(),
        stickerId: t.String(),
      }),
      body: t.Object({
        count: t.Integer({ minimum: 0, maximum: 999 }),
      }),
    },
  );
