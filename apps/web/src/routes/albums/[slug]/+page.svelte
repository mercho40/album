<script lang="ts">
	import StickerGrid from "$lib/components/sticker-grid.svelte";
	import { PUBLIC_API_URL } from "$env/static/public";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
	// Local mutable copy for optimistic updates; $effect syncs when server data changes.
	let stickers: PageData["stickers"] = $state([]);

	$effect(() => {
		stickers = data.stickers;
	});

	async function updateCount(stickerId: string, count: number) {
		const prev = stickers;
		stickers = stickers.map((s) => (s.stickerId === stickerId ? { ...s, count } : s));

		try {
			const res = await fetch(
				`${PUBLIC_API_URL}/albums/${data.album.slug}/stickers/${stickerId}`,
				{
					method: "PATCH",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ count }),
				},
			);
			if (!res.ok) {
				stickers = prev;
				console.error("PATCH failed", await res.text());
			}
		} catch (e) {
			stickers = prev;
			console.error(e);
		}
	}
</script>

<StickerGrid stickers={stickers} mode={data.canEdit ? "edit" : "view"} onUpdate={updateCount} />
