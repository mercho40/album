import { Elysia, t } from "elysia";
import { db } from "../db/drizzle";
import { album, organization, member, user as userTable } from "../db/schema";
import { auth } from "../lib/auth";
import { betterAuth } from "./_shared";
import { and, eq } from "drizzle-orm";

const MANAGER_ROLES = ["owner", "admin"];

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
        // Si el slug ya existe, devolvemos 409 antes de delegar a Better Auth
        // (que a veces devuelve un objeto inválido en vez de tirar excepción).
        const [existing] = await db
          .select({ id: organization.id })
          .from(organization)
          .where(eq(organization.slug, body.slug))
          .limit(1);
        if (existing) {
          return status(409, {
            error: { code: "SLUG_TAKEN", message: "Ese slug ya está en uso" },
          });
        }

        const created = await auth.api.createOrganization({
          headers: request.headers,
          body: { name: body.name, slug: body.slug },
        });

        if (!created || typeof created.slug !== "string" || typeof created.id !== "string") {
          return status(400, {
            error: { code: "ORG_CREATE_FAILED", message: "No se pudo crear el álbum" },
          });
        }

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
            error: { code: "SLUG_TAKEN", message: "Ese slug ya está en uso" },
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
  )
  .patch(
    "/:slug",
    async ({ params, body, user, status }) => {
      const [a] = await db
        .select({ id: organization.id })
        .from(album)
        .innerJoin(organization, eq(organization.id, album.organizationId))
        .where(eq(organization.slug, params.slug))
        .limit(1);
      if (!a) {
        return status(404, {
          error: { code: "ALBUM_NOT_FOUND", message: "Álbum no encontrado" },
        });
      }

      const [requester] = await db
        .select({ role: member.role })
        .from(member)
        .where(and(eq(member.organizationId, a.id), eq(member.userId, user.id)))
        .limit(1);
      if (!requester || !MANAGER_ROLES.includes(requester.role)) {
        return status(403, {
          error: { code: "FORBIDDEN", message: "Solo el propietario puede editar el álbum" },
        });
      }

      if (body.name !== undefined) {
        await db
          .update(organization)
          .set({ name: body.name })
          .where(eq(organization.id, a.id));
      }

      const albumPatch: Partial<{ description: string | null; visibility: string }> = {};
      if (body.description !== undefined) albumPatch.description = body.description || null;
      if (body.visibility !== undefined) albumPatch.visibility = body.visibility;
      if (Object.keys(albumPatch).length > 0) {
        await db
          .update(album)
          .set(albumPatch)
          .where(eq(album.organizationId, a.id));
      }

      return { ok: true } as const;
    },
    {
      auth: true,
      params: t.Object({ slug: t.String() }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1, maxLength: 64 })),
        description: t.Optional(t.String({ maxLength: 500 })),
        visibility: t.Optional(
          t.Union([t.Literal("public"), t.Literal("unlisted"), t.Literal("private")]),
        ),
      }),
    },
  )
  .delete(
    "/:slug",
    async ({ params, user, status }) => {
      const [a] = await db
        .select({ id: organization.id })
        .from(album)
        .innerJoin(organization, eq(organization.id, album.organizationId))
        .where(eq(organization.slug, params.slug))
        .limit(1);
      if (!a) {
        return status(404, {
          error: { code: "ALBUM_NOT_FOUND", message: "Álbum no encontrado" },
        });
      }

      const [requester] = await db
        .select({ role: member.role })
        .from(member)
        .where(and(eq(member.organizationId, a.id), eq(member.userId, user.id)))
        .limit(1);
      if (!requester || requester.role !== "owner") {
        return status(403, {
          error: { code: "FORBIDDEN", message: "Solo el propietario puede eliminar el álbum" },
        });
      }

      // Cascada: organization → member, invitation, album → albumSticker.
      await db.delete(organization).where(eq(organization.id, a.id));

      return { ok: true } as const;
    },
    { auth: true, params: t.Object({ slug: t.String() }) },
  )
  .get(
    "/:slug/members",
    async ({ params, user, status }) => {
      const [a] = await db
        .select({ id: organization.id })
        .from(album)
        .innerJoin(organization, eq(organization.id, album.organizationId))
        .where(eq(organization.slug, params.slug))
        .limit(1);
      if (!a) {
        return status(404, {
          error: { code: "ALBUM_NOT_FOUND", message: "Álbum no encontrado" },
        });
      }

      const [requester] = await db
        .select({ role: member.role })
        .from(member)
        .where(and(eq(member.organizationId, a.id), eq(member.userId, user.id)))
        .limit(1);
      if (!requester) {
        return status(403, {
          error: { code: "FORBIDDEN", message: "No sos miembro de este álbum" },
        });
      }

      const rows = await db
        .select({
          userId: userTable.id,
          name: userTable.name,
          email: userTable.email,
          image: userTable.image,
          role: member.role,
          joinedAt: member.createdAt,
        })
        .from(member)
        .innerJoin(userTable, eq(userTable.id, member.userId))
        .where(eq(member.organizationId, a.id))
        .orderBy(member.createdAt);

      return rows;
    },
    { auth: true, params: t.Object({ slug: t.String() }) },
  )
  .post(
    "/:slug/members",
    async ({ params, body, user, status }) => {
      const [a] = await db
        .select({ id: organization.id })
        .from(album)
        .innerJoin(organization, eq(organization.id, album.organizationId))
        .where(eq(organization.slug, params.slug))
        .limit(1);
      if (!a) {
        return status(404, {
          error: { code: "ALBUM_NOT_FOUND", message: "Álbum no encontrado" },
        });
      }

      const [requester] = await db
        .select({ role: member.role })
        .from(member)
        .where(and(eq(member.organizationId, a.id), eq(member.userId, user.id)))
        .limit(1);
      if (!requester || !MANAGER_ROLES.includes(requester.role)) {
        return status(403, {
          error: { code: "FORBIDDEN", message: "Solo el propietario puede agregar miembros" },
        });
      }

      const email = body.email.trim().toLowerCase();
      const [invitee] = await db
        .select({ id: userTable.id, name: userTable.name, email: userTable.email, image: userTable.image })
        .from(userTable)
        .where(eq(userTable.email, email))
        .limit(1);
      if (!invitee) {
        return status(404, {
          error: {
            code: "USER_NOT_FOUND",
            message: "Esa persona todavía no tiene cuenta. Pedile que se registre primero.",
          },
        });
      }

      const [existing] = await db
        .select({ id: member.id })
        .from(member)
        .where(and(eq(member.organizationId, a.id), eq(member.userId, invitee.id)))
        .limit(1);
      if (existing) {
        return status(409, {
          error: { code: "ALREADY_MEMBER", message: "Esa persona ya es miembro" },
        });
      }

      const now = new Date();
      const id = crypto.randomUUID();
      await db.insert(member).values({
        id,
        organizationId: a.id,
        userId: invitee.id,
        role: "editor",
        createdAt: now,
      });

      return {
        userId: invitee.id,
        name: invitee.name,
        email: invitee.email,
        image: invitee.image,
        role: "editor" as const,
        joinedAt: now,
      };
    },
    {
      auth: true,
      params: t.Object({ slug: t.String() }),
      body: t.Object({ email: t.String({ format: "email", minLength: 3, maxLength: 320 }) }),
    },
  )
  .delete(
    "/:slug/members/:userId",
    async ({ params, user, status }) => {
      const [a] = await db
        .select({ id: organization.id })
        .from(album)
        .innerJoin(organization, eq(organization.id, album.organizationId))
        .where(eq(organization.slug, params.slug))
        .limit(1);
      if (!a) {
        return status(404, {
          error: { code: "ALBUM_NOT_FOUND", message: "Álbum no encontrado" },
        });
      }

      const [target] = await db
        .select({ role: member.role })
        .from(member)
        .where(and(eq(member.organizationId, a.id), eq(member.userId, params.userId)))
        .limit(1);
      if (!target) {
        return status(404, {
          error: { code: "MEMBER_NOT_FOUND", message: "Esa persona no es miembro" },
        });
      }

      const isSelf = user.id === params.userId;

      if (!isSelf) {
        const [requester] = await db
          .select({ role: member.role })
          .from(member)
          .where(and(eq(member.organizationId, a.id), eq(member.userId, user.id)))
          .limit(1);
        if (!requester || !MANAGER_ROLES.includes(requester.role)) {
          return status(403, {
            error: { code: "FORBIDDEN", message: "Solo el propietario puede quitar miembros" },
          });
        }
      }

      if (isSelf && target.role === "owner") {
        return status(400, {
          error: {
            code: "OWNER_CANNOT_LEAVE",
            message: "El propietario no puede dejar el álbum",
          },
        });
      }

      await db
        .delete(member)
        .where(and(eq(member.organizationId, a.id), eq(member.userId, params.userId)));

      return { ok: true } as const;
    },
    {
      auth: true,
      params: t.Object({ slug: t.String(), userId: t.String() }),
    },
  );
