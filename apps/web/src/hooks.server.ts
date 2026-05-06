import { getCookieCache } from "better-auth/cookies";
import { PUBLIC_API_URL } from "$env/static/public";
import type { Handle, HandleFetch } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
	const session = await getCookieCache(event.request);
	event.locals.user = session?.user ?? null;

	return resolve(event, {
		preload: ({ type }) => type === "font" || type === "js" || type === "css",
	});
};

// Forward cookies del browser al back en cross-origin SSR fetches.
// SvelteKit no propaga cookies a otros hosts por default; las cookies
// con Domain=.parent.tld están en el request al SSR pero hay que
// reenviarlas explícitamente al back.
export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
	if (PUBLIC_API_URL && request.url.startsWith(PUBLIC_API_URL)) {
		const cookie = event.request.headers.get("cookie");
		if (cookie) request.headers.set("cookie", cookie);
	}
	return fetch(request);
};
