<script lang="ts">
	import { setContext } from "svelte";
	import BackLink from "$lib/components/back-link.svelte";
	import ShareDialog from "$lib/components/share-dialog.svelte";
	import StatsDialog from "$lib/components/stats-dialog.svelte";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import LinkIcon from "@lucide/svelte/icons/link-2";
	import CheckIcon from "@lucide/svelte/icons/check";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils";
	import { toast } from "svelte-sonner";
	import { page } from "$app/state";

	interface StickerRow {
		stickerId: string;
		number: string;
		playerName: string;
		team: string;
		type: string;
		imageUrl: string | null;
		count: number;
	}

	let { data, children } = $props();

	// Shared reactive object — the page writes stickers here once resolved.
	const stickersCtx = $state<{ items: StickerRow[] }>({ items: [] });
	setContext("stickersCtx", stickersCtx);

	// En sub-rutas (settings, etc.) el back lleva al álbum; en la raíz del álbum, al home.
	const albumPath = $derived(`/albums/${data.album.slug}`);
	const backHref = $derived(page.url.pathname === albumPath ? "/" : albumPath);

	let copied = $state(false);
	let copyTimer: ReturnType<typeof setTimeout> | undefined;

	async function copyAlbumLink() {
		try {
			const url = `${window.location.origin}/albums/${data.album.slug}`;
			await navigator.clipboard.writeText(url);
			copied = true;
			if (copyTimer) clearTimeout(copyTimer);
			copyTimer = setTimeout(() => (copied = false), 1500);
			toast.success("Link copiado");
		} catch {
			toast.error("No se pudo copiar el link");
		}
	}
</script>

<svelte:head>
	<title>{data.album.name} · Álbum</title>
	<meta name="description" content={data.album.description ?? "Álbum compartido del Mundial 2026."} />
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-6 md:p-10">
	<header class="mb-6">
		<div class="flex items-center gap-2">
			<BackLink href={backHref} class="-ml-2" />
			<h1 class="min-w-0 flex-1 truncate text-3xl font-bold">{data.album.name}</h1>
			<button
				type="button"
				onclick={copyAlbumLink}
				aria-label="Copiar link del álbum"
				class={cn(
					buttonVariants({ variant: "ghost", size: "icon" }),
					"size-11 shrink-0",
				)}
			>
				{#if copied}
					<CheckIcon class="size-5" />
				{:else}
					<LinkIcon class="size-5" />
				{/if}
			</button>
			<StatsDialog stickers={stickersCtx.items} />
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
