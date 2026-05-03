import { error } from "@sveltejs/kit";
import { createApi } from "$lib/api";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, fetch }) => {
	const api = createApi(fetch);
	const res = await api.albums({ slug: params.slug }).stickers.get();
	if (res.error) throw error(500, "No se pudieron cargar las figuritas");
	return { stickers: res.data ?? [] };
};
