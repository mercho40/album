<script lang="ts">
	import StickerGrid from "$lib/components/sticker-grid.svelte";
	import { Skeleton } from "$lib/components/ui/skeleton/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Empty from "$lib/components/ui/empty/index.js";
	import { PUBLIC_API_URL } from "$env/static/public";
	import type { PageData } from "./$types";
	import { toast } from "svelte-sonner";
	import AlertTriangleIcon from "@lucide/svelte/icons/alert-triangle";

	let { data }: { data: PageData } = $props();

	type Sticker = Awaited<PageData["stickers"]>[number];

	// Copia local mutable para optimistic updates. El $effect re-sincroniza
	// cuando data.stickers cambia (al navegar a otro álbum).
	let stickers = $state<Sticker[]>([]);

	$effect(() => {
		let cancelled = false;
		data.stickers.then((s) => {
			if (!cancelled) stickers = s;
		});
		return () => {
			cancelled = true;
		};
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

{#await data.stickers}
	<div class="space-y-6" aria-busy="true" aria-live="polite">
		<!-- Filter panel -->
		<div class="space-y-3">
			<Skeleton class="h-9 w-full md:max-w-sm" />
			<div class="flex flex-wrap gap-2">
				<Skeleton class="h-9 w-20 rounded-full" />
				<Skeleton class="h-9 w-24 rounded-full" />
				<Skeleton class="h-9 w-24 rounded-full" />
			</div>
			<div class="-mx-4 overflow-hidden md:-mx-10">
				<div class="flex gap-2 px-4 md:px-10">
					{#each [60, 64, 72, 56, 68, 60, 76, 64, 72, 60, 68, 64] as w, i (i)}
						<div class="shrink-0" style="width: {w}px">
							<Skeleton class="h-9 w-full rounded-full" />
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Sticker sections -->
		{#each Array(2) as _, si (si)}
			<section>
				<Skeleton class="mb-3 h-6 w-24" />
				<div class="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
					{#each Array(8) as _, ci (ci)}
						<Skeleton class="h-48 w-full rounded-lg" />
					{/each}
				</div>
			</section>
		{/each}
	</div>
{:then _}
	<StickerGrid stickers={stickers} mode={data.canEdit ? "edit" : "view"} onUpdate={updateCount} />
{:catch}
	<Empty.Root class="rounded-lg border bg-muted/30">
		<Empty.Header>
			<Empty.Media variant="icon">
				<AlertTriangleIcon />
			</Empty.Media>
			<Empty.Title>No se pudieron cargar las figuritas</Empty.Title>
			<Empty.Description>Probá recargar la página.</Empty.Description>
		</Empty.Header>
		<Empty.Content>
			<Button variant="outline" size="sm" onclick={() => location.reload()}>Recargar</Button>
		</Empty.Content>
	</Empty.Root>
{/await}
