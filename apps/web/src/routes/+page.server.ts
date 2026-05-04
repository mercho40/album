import { createApi } from "$lib/api";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, fetch }) => {
	if (!locals.user) return { albums: null };
	const api = createApi(fetch);
	const res = await api.albums.me.get();
	return { albums: res.data ?? [] };
};
