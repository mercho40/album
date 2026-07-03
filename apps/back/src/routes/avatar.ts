import { Elysia, t } from "elysia";
import { put } from "@vercel/blob";
import { betterAuth } from "./_shared";

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const avatarRoutes = new Elysia({ prefix: "/avatar" })
  .use(betterAuth)
  .post(
    "/",
    async ({ body, user, status }) => {
      const { file } = body;

      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return status(500, {
          error: { code: "BLOB_NOT_CONFIGURED", message: "Almacenamiento de imágenes no configurado" },
        });
      }

      const ext = EXT_BY_TYPE[file.type] ?? "jpg";
      const blob = await put(`avatars/${user.id}.${ext}`, file, {
        access: "public",
        addRandomSuffix: true,
        contentType: file.type,
      });

      return { url: blob.url };
    },
    {
      auth: true,
      body: t.Object({
        file: t.File({
          type: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          maxSize: "4m",
        }),
      }),
    },
  );
