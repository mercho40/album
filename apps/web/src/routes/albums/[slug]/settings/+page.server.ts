import { error, fail, redirect } from "@sveltejs/kit";
import { createApi } from "$lib/api";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
	const { canManage, album } = await parent();
	if (!canManage) {
		error(403, "Solo el propietario puede editar el álbum");
	}
	return { album };
};

export const actions: Actions = {
	update: async ({ request, params, fetch, locals }) => {
		if (!locals.user) error(401);
		const data = await request.formData();
		const name = (data.get("name") ?? "").toString().trim();
		const description = (data.get("description") ?? "").toString();
		const visibility = (data.get("visibility") ?? "").toString();

		if (!name || name.length > 64) {
			return fail(400, { error: "El nombre es obligatorio (máx. 64 caracteres)" });
		}
		if (description.length > 500) {
			return fail(400, { error: "La descripción es muy larga (máx. 500 caracteres)" });
		}
		if (!["public", "unlisted", "private"].includes(visibility)) {
			return fail(400, { error: "Visibilidad inválida" });
		}

		const api = createApi(fetch);
		const res = await api.albums({ slug: params.slug }).patch({
			name,
			description,
			visibility: visibility as "public" | "unlisted" | "private",
		});
		if (res.error) {
			const msg =
				(res.error.value as { error?: { message?: string } })?.error?.message ??
				"No se pudo actualizar el álbum";
			return fail(res.status ?? 400, { error: msg });
		}

		return { success: true };
	},

	delete: async ({ params, fetch, locals }) => {
		if (!locals.user) error(401);
		const api = createApi(fetch);
		const res = await api.albums({ slug: params.slug }).delete();
		if (res.error) {
			const msg =
				(res.error.value as { error?: { message?: string } })?.error?.message ??
				"No se pudo eliminar el álbum";
			return fail(res.status ?? 400, { error: msg });
		}
		redirect(303, "/");
	},
};
