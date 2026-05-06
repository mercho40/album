import { redirect, fail } from "@sveltejs/kit";
import { createApi } from "$lib/api";
import type { Actions } from "./$types";

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const formData = await request.formData();
		const name = String(formData.get("name") ?? "").trim();
		const slug = String(formData.get("slug") ?? "").trim();
		const visibility = String(formData.get("visibility") ?? "public") as
			| "public"
			| "unlisted"
			| "private";

		if (!name || !slug) {
			return fail(400, {
				error: "Nombre y slug son obligatorios",
				values: { name, slug },
			});
		}

		const api = createApi(fetch);
		const res = await api.albums.post({ name, slug, visibility });

		if (res.error || !res.data?.slug) {
			const code = (res.error?.value as { error?: { code?: string } })?.error?.code;
			const message =
				code === "SLUG_TAKEN" ? "Ese slug ya está en uso" : "No se pudo crear el álbum";
			return fail(400, { error: message, values: { name, slug } });
		}

		throw redirect(303, `/albums/${res.data.slug}`);
	},
};
