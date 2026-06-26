import { error } from "@sveltejs/kit";
import { createApi } from "$lib/api";
import { albumPermissions } from "$lib/permissions";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ params, fetch, locals }) => {
	const api = createApi(fetch);

	const albumRes = await api.albums({ slug: params.slug }).get();

	if (albumRes.error || !albumRes.data) {
		throw error(404, "Álbum no encontrado");
	}

	let memberRole: string | null = null;
	if (locals.user) {
		const meRes = await api.albums.me.get();
		const found = meRes.data?.find((a) => a.slug === params.slug);
		memberRole = found?.memberRole ?? null;
	}

	const { canEdit, canManage } = albumPermissions(memberRole);

	return {
		album: albumRes.data,
		memberRole,
		canEdit,
		canManage,
	};
};
