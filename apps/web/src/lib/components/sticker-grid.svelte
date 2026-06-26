<script lang="ts">
	import { tick } from "svelte";
	import StickerCard from "./sticker-card.svelte";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Empty from "$lib/components/ui/empty/index.js";
	import SearchXIcon from "@lucide/svelte/icons/search-x";
	import XIcon from "@lucide/svelte/icons/x";
	import { stickerMatchesQuery } from "$lib/search";
	import { cn } from "$lib/utils";

	interface StickerRow {
		stickerId: string;
		number: string;
		playerName: string;
		team: string;
		type: string;
		imageUrl: string | null;
		count: number;
	}

	interface Props {
		stickers: StickerRow[];
		mode: "edit" | "view";
		onUpdate?: (stickerId: string, count: number) => void;
	}

	let { stickers, mode, onUpdate }: Props = $props();

	let search = $state("");
	let statusFilter = $state<"all" | "missing" | "dupes">("all");
	let teamFilter = $state<string | null>(null);

	let gridRoot: HTMLDivElement | undefined;
	let searchInputEl: HTMLInputElement | null = $state(null);

	function clearSearch() {
		search = "";
		searchInputEl?.focus();
	}

	function resetFilters() {
		search = "";
		statusFilter = "all";
		teamFilter = null;
	}

	async function selectTeam(team: string | null) {
		teamFilter = teamFilter === team ? null : team;
		await tick();
		if (typeof window === "undefined" || !gridRoot) return;
		const firstSection = gridRoot.querySelector("section");
		if (!firstSection) return;
		const target = firstSection.getBoundingClientRect().top + window.scrollY - 16;
		window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
	}

	// Mantener orden de aparición (el back devuelve por createdAt = orden del seed = grupos A-L).
	const allTeams = $derived([...new Set(stickers.map((s) => s.team))]);

	const filteredStickers = $derived.by(() => {
		return stickers.filter((s) => {
			if (!stickerMatchesQuery(s, search)) return false;
			if (statusFilter === "missing" && s.count !== 0) return false;
			if (statusFilter === "dupes" && s.count < 2) return false;
			if (teamFilter && s.team !== teamFilter) return false;
			return true;
		});
	});

	const groupedByTeam = $derived(
		filteredStickers.reduce<Record<string, StickerRow[]>>((acc, s) => {
			(acc[s.team] ||= []).push(s);
			return acc;
		}, {}),
	);
	// Mantener orden de aparición (el back devuelve por createdAt = orden del seed = grupos A-L).
	const teams = $derived(Object.keys(groupedByTeam));

</script>

<div class="space-y-6" bind:this={gridRoot}>
	<!-- Filter panel -->
	<div class="space-y-3">
		<!-- Search input -->
		<div class="relative md:max-w-sm">
			<Input
				bind:ref={searchInputEl}
				type="search"
				placeholder="Buscar jugador, país o código..."
				bind:value={search}
				class="w-full pr-9"
			/>
			{#if search}
				<button
					type="button"
					onclick={clearSearch}
					aria-label="Limpiar búsqueda"
					class="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<XIcon class="size-3.5" />
				</button>
			{/if}
		</div>

		<!-- Status chips -->
		<div class="flex flex-wrap gap-2">
			<button
				type="button"
				class={cn(
					"rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
					statusFilter === "all"
						? "bg-primary text-primary-foreground"
						: "bg-muted text-muted-foreground hover:bg-muted/80",
				)}
				onclick={() => (statusFilter = "all")}
			>
				Todas
			</button>
			<button
				type="button"
				class={cn(
					"rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
					statusFilter === "missing"
						? "bg-primary text-primary-foreground"
						: "bg-muted text-muted-foreground hover:bg-muted/80",
				)}
				onclick={() => (statusFilter = "missing")}
			>
				Faltantes
			</button>
			<button
				type="button"
				class={cn(
					"rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
					statusFilter === "dupes"
						? "bg-primary text-primary-foreground"
						: "bg-muted text-muted-foreground hover:bg-muted/80",
				)}
				onclick={() => (statusFilter = "dupes")}
			>
				Repetidas
			</button>
		</div>

		<!-- Team chips (horizontal scroll on mobile, edge-bleed) -->
		<div class="-mx-4 overflow-x-auto pb-1 no-scrollbar md:-mx-10">
			<div class="flex w-max gap-2 px-4 md:px-10">
				<button
					type="button"
					class={cn(
						"rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
						teamFilter === null
							? "bg-primary text-primary-foreground"
							: "bg-muted text-muted-foreground hover:bg-muted/80",
					)}
					onclick={() => selectTeam(null)}
				>
					Todos
				</button>
				{#each allTeams as team (team)}
					<button
						type="button"
						class={cn(
							"rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							teamFilter === team
								? "bg-primary text-primary-foreground"
								: "bg-muted text-muted-foreground hover:bg-muted/80",
						)}
						onclick={() => selectTeam(team)}
					>
						{team}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Team sections grid or empty state -->
	{#if filteredStickers.length === 0}
		<Empty.Root class="rounded-lg border bg-muted/30">
			<Empty.Header>
				<Empty.Media variant="icon">
					<SearchXIcon />
				</Empty.Media>
				<Empty.Title>Sin resultados</Empty.Title>
				<Empty.Description>No hay figuritas con esos filtros.</Empty.Description>
			</Empty.Header>
			<Empty.Content>
				<Button variant="outline" size="sm" onclick={resetFilters}>Limpiar filtros</Button>
			</Empty.Content>
		</Empty.Root>
	{:else}
		{#each teams as team (team)}
			<section>
				<h2 class="mb-3 text-lg font-semibold">{team}</h2>
				<div class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
					{#each groupedByTeam[team] as s (s.stickerId)}
						<StickerCard
							stickerId={s.stickerId}
							number={s.number}
							playerName={s.playerName}
							team={s.team}
							type={s.type}
							imageUrl={s.imageUrl}
							count={s.count}
							{mode}
							onIncrement={() => onUpdate?.(s.stickerId, s.count + 1)}
							onDecrement={() => onUpdate?.(s.stickerId, Math.max(0, s.count - 1))}
						/>
					{/each}
				</div>
			</section>
		{/each}
	{/if}
</div>
