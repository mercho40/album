<script lang="ts">
	import BackLink from "$lib/components/back-link.svelte";

	let { data, children } = $props();
</script>

<svelte:head>
	<title>{data.album.name} · Álbum</title>
	<meta name="description" content={data.album.description ?? "Álbum compartido del Mundial 2026."} />
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-6 md:p-10">
	<header class="mb-6">
		<div class="flex items-center gap-2">
			<BackLink class="-ml-2" />
			<h1 class="min-w-0 truncate text-3xl font-bold">{data.album.name}</h1>
		</div>
		{#if data.album.description}
			<p class="mt-1 text-muted-foreground">{data.album.description}</p>
		{/if}
	</header>

	{@render children()}
</div>
