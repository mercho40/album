<script lang="ts">
	let { data, children } = $props();
</script>

<svelte:head>
	<title>{data.album.name} · Álbum</title>
	<meta name="description" content={data.album.description ?? "Álbum compartido del Mundial 2026."} />
</svelte:head>

<div class="mx-auto max-w-6xl p-6 md:p-10">
	<header class="mb-6">
		<a
			href="/"
			class="text-sm text-muted-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
		>← Inicio</a>
		<h1 class="mt-2 text-3xl font-bold">{data.album.name}</h1>
		{#if data.album.description}
			<p class="text-muted-foreground">{data.album.description}</p>
		{/if}
		<p class="mt-1 text-xs text-muted-foreground">
			{data.album.visibility} · {data.canEdit ? "Editor" : "Visitante"}
		</p>
	</header>

	{@render children()}
</div>
