<script lang="ts">
	import BackLink from "$lib/components/back-link.svelte";
	import ShareDialog from "$lib/components/share-dialog.svelte";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils";

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
			<h1 class="min-w-0 flex-1 truncate text-3xl font-bold">{data.album.name}</h1>
			{#if data.memberRole !== null}
				<ShareDialog
					albumSlug={data.album.slug}
					canManage={data.canManage}
					currentUserId={data.user?.id}
					currentUserRole={data.memberRole}
				/>
			{/if}
			{#if data.canManage}
				<a
					href="/albums/{data.album.slug}/settings"
					aria-label="Configuración"
					class={cn(
						buttonVariants({ variant: "ghost", size: "icon" }),
						"size-11 shrink-0",
					)}
				>
					<SettingsIcon class="size-5" />
				</a>
			{/if}
		</div>
		{#if data.album.description}
			<p class="mt-1 text-muted-foreground">{data.album.description}</p>
		{/if}
	</header>

	{@render children()}
</div>
