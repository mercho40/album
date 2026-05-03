<script lang="ts">
	let { data, children } = $props();
</script>

<div class="mx-auto max-w-6xl p-6 md:p-10">
	<header class="mb-6">
		<a href="/dashboard" class="text-sm text-muted-foreground underline">← Mis álbumes</a>
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
