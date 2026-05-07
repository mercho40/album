import { createApi } from "$lib/api";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ params, fetch }) => {
	const api = createApi(fetch);
	// Promesa sin await → SvelteKit la stremea al browser. El layout (metadata
	// del álbum) sigue blocking, así que el header aparece apenas resuelve el
	// layout (~150ms) y las figuritas (~350ms) caen después.
	const stickers = api
		.albums({ slug: params.slug })
		.stickers.get()
		.then((res) => {
			if (res.error) throw new Error("No se pudieron cargar las figuritas");
			return res.data ?? [];
		});

	return { stickers };
};
