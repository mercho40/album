import { Elysia, t } from "elysia";
import { db } from "../db/drizzle";
import { album, organization, member } from "../db/schema";
import { auth } from "../lib/auth";
import { betterAuth } from "./_shared";
import { and, eq } from "drizzle-orm";

export const albumRoutes = new Elysia({ prefix: "/albums" })
  .use(betterAuth)
  .get(
    "/check-slug",
    async ({ query }) => {
      const [row] = await db
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.slug, query.value))
        .limit(1);
      return { available: !row };
    },
    {
      auth: true,
      query: t.Object({ value: t.String({ minLength: 1, maxLength: 64 }) }),
    },
  )
  .post(
    "/",
    async ({ body, request, status }) => {
      try {
        const created = await auth.api.createOrganization({
          headers: request.headers,
          body: { name: body.name, slug: body.slug },
        });

        if (!created) {
          return status(400, {
            error: { code: "ORG_CREATE_FAILED", message: "No se pudo crear la organización" },
          });
        }

        // Patch album extension if extras were provided
        if (body.visibility || body.description) {
          await db
            .update(album)
            .set({
              ...(body.visibility ? { visibility: body.visibility } : {}),
              ...(body.description ? { description: body.description } : {}),
            })
            .where(eq(album.organizationId, created.id));
        }

        return { id: created.id, slug: created.slug, name: created.name };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.toLowerCase().includes("slug")) {
          return status(409, {
            error: { code: "SLUG_TAKEN", message: "Slug ya está en uso" },
          });
        }
        throw e;
      }
    },
    {
      auth: true,
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 64 }),
        slug: t.String({ minLength: 1, maxLength: 64, pattern: "^[a-z0-9-]+$" }),
        visibility: t.Optional(
          t.Union([t.Literal("public"), t.Literal("unlisted"), t.Literal("private")]),
        ),
        description: t.Optional(t.String({ maxLength: 500 })),
      }),
    },
  )
  .get(
    "/me",
    async ({ user }) => {
      const rows = await db
        .select({
          id: organization.id,
          slug: organization.slug,
          name: organization.name,
          visibility: album.visibility,
          description: album.description,
          coverImageUrl: album.coverImageUrl,
          memberRole: member.role,
        })
        .from(member)
        .innerJoin(organization, eq(organization.id, member.organizationId))
        .innerJoin(album, eq(album.organizationId, organization.id))
        .where(eq(member.userId, user.id))
        .orderBy(organization.name);
      return rows;
    },
    { auth: true },
  )
  .get(
    "/:slug",
    async ({ params, request, status }) => {
      const [row] = await db
        .select({
          id: organization.id,
          slug: organization.slug,
          name: organization.name,
          visibility: album.visibility,
          description: album.description,
          coverImageUrl: album.coverImageUrl,
          createdAt: organization.createdAt,
        })
        .from(album)
        .innerJoin(organization, eq(organization.id, album.organizationId))
        .where(eq(organization.slug, params.slug))
        .limit(1);

      if (!row) {
        return status(404, {
          error: { code: "ALBUM_NOT_FOUND", message: "Álbum no encontrado" },
        });
      }

      if (row.visibility === "private") {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) {
          return status(404, { error: { code: "ALBUM_NOT_FOUND", message: "Álbum no encontrado" } });
        }
        const [m] = await db
          .select({ role: member.role })
          .from(member)
          .where(and(eq(member.organizationId, row.id), eq(member.userId, session.user.id)))
          .limit(1);
        if (!m) {
          return status(404, { error: { code: "ALBUM_NOT_FOUND", message: "Álbum no encontrado" } });
        }
      }

      return row;
    },
    { params: t.Object({ slug: t.String() }) },
  );
