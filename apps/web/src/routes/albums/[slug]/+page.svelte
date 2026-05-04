<script lang="ts">
	import StickerGrid from "$lib/components/sticker-grid.svelte";
	import { Skeleton } from "$lib/components/ui/skeleton/index.js";
	import { PUBLIC_API_URL } from "$env/static/public";
	import type { PageData } from "./$types";
	import { navigating } from "$app/state";
	import { toast } from "svelte-sonner";

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
				toast.error("No se pudo actualizar la figurita");
			}
		} catch (e) {
			stickers = prev;
			toast.error("No se pudo actualizar la figurita");
		}
	}
</script>

{#if navigating.to}
	<div class="space-y-6">
		<div class="space-y-1">
			<Skeleton class="h-5 w-32" />
			<Skeleton class="h-1.5 w-full" />
		</div>
		<Skeleton class="h-10 w-full md:max-w-sm" />
		<div class="flex gap-2">
			<Skeleton class="h-9 w-20 rounded-full" />
			<Skeleton class="h-9 w-24 rounded-full" />
			<Skeleton class="h-9 w-24 rounded-full" />
		</div>
		{#each Array(2) as _, si (si)}
			<section>
				<Skeleton class="mb-3 h-6 w-32" />
				<div class="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
					{#each Array(8) as _, ci (ci)}
						<Skeleton class="h-48 w-full" />
					{/each}
				</div>
			</section>
		{/each}
	</div>
{:else}
	<StickerGrid stickers={stickers} mode={data.canEdit ? "edit" : "view"} onUpdate={updateCount} />
{/if}
