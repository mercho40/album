import { redirect, fail } from "@sveltejs/kit";
import { createApi } from "$lib/api";
import type { Actions } from "./$types";

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const formData = await request.formData();
		const name = String(formData.get("name") ?? "").trim();
		const slug = String(formData.get("slug") ?? "").trim();
		const slugAuto = formData.get("slugAuto") === "true";
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

		// Si el slug fue autogenerado del name, reintentar con sufijo numérico
		// hasta encontrar uno libre. Si fue editado manualmente, fallamos al primer error.
		let attempt = slug;
		const maxAttempts = slugAuto ? 50 : 1;
		for (let i = 0; i < maxAttempts; i++) {
			const res = await api.albums.post({ name, slug: attempt, visibility });
			if (!res.error && res.data?.slug) {
				throw redirect(303, `/albums/${res.data.slug}`);
			}
			const code = (res.error?.value as { error?: { code?: string } })?.error?.code;
			if (code !== "SLUG_TAKEN" || !slugAuto) {
				const message =
					code === "SLUG_TAKEN" ? "Ese slug ya está en uso" : "No se pudo crear el álbum";
				return fail(400, { error: message, values: { name, slug: attempt } });
			}
			attempt = `${slug}-${i + 2}`;
		}

		return fail(400, {
			error: "No se pudo encontrar un slug libre",
			values: { name, slug },
		});
	},
};
