<script lang="ts">
	import StickerCard from "./sticker-card.svelte";
	import { Input } from "$lib/components/ui/input/index.js";
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

	function resetFilters() {
		search = "";
		statusFilter = "all";
		teamFilter = null;
	}

	const allTeams = $derived([...new Set(stickers.map((s) => s.team))].sort());

	const filteredStickers = $derived(
		stickers.filter((s) => {
			if (
				search.trim() &&
				!s.playerName.toLowerCase().includes(search.trim().toLowerCase())
			)
				return false;
			if (statusFilter === "missing" && s.count !== 0) return false;
			if (statusFilter === "dupes" && s.count < 2) return false;
			if (teamFilter && s.team !== teamFilter) return false;
			return true;
		}),
	);

	const groupedByTeam = $derived(
		filteredStickers.reduce<Record<string, StickerRow[]>>((acc, s) => {
			(acc[s.team] ||= []).push(s);
			return acc;
		}, {}),
	);
	// Mantener orden de aparición (el back devuelve por createdAt = orden del seed = grupos A-L).
	const teams = $derived(Object.keys(groupedByTeam));

	const total = $derived(stickers.length);
	const owned = $derived(stickers.filter((s) => s.count >= 1).length);
	const dupes = $derived(stickers.reduce((acc, s) => acc + Math.max(0, s.count - 1), 0));

	const isFiltered = $derived(
		search.trim() !== "" || statusFilter !== "all" || teamFilter !== null,
	);
</script>

<div class="space-y-6">
	<!-- Progress (NO sticky) -->
	<div class="space-y-1">
		<div class="flex items-baseline justify-between text-sm">
			<span class="font-medium tabular-nums">
				{owned} <span class="text-muted-foreground">/ {total}</span>
			</span>
			<span class="text-muted-foreground tabular-nums">
				+{dupes} repetida{dupes !== 1 ? "s" : ""}
			</span>
		</div>
		<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
			<div
				class="h-full bg-foreground transition-all"
				style:width="{total === 0 ? 0 : (owned / total) * 100}%"
			></div>
		</div>
	</div>

	<!-- Sticky filter panel (sin progress) -->
	<div
		class="sticky top-0 z-10 -mx-4 bg-background/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6"
	>
		<div class="space-y-3">
			<!-- Search input -->
			<Input
				type="search"
				placeholder="Buscar jugador..."
				bind:value={search}
				class="w-full md:max-w-sm"
			/>

			<!-- Status chips -->
			<div class="flex flex-wrap gap-2">
				<button
					type="button"
					class={cn(
						"rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition",
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
						"rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition",
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
						"rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition",
						statusFilter === "dupes"
							? "bg-primary text-primary-foreground"
							: "bg-muted text-muted-foreground hover:bg-muted/80",
					)}
					onclick={() => (statusFilter = "dupes")}
				>
					Repetidas
				</button>
			</div>

			<!-- Team chips (horizontal scroll on mobile) -->
			<div class="flex gap-2 overflow-x-auto pb-1">
				<button
					type="button"
					class={cn(
						"rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition",
						teamFilter === null
							? "bg-primary text-primary-foreground"
							: "bg-muted text-muted-foreground hover:bg-muted/80",
					)}
					onclick={() => (teamFilter = null)}
				>
					Todos
				</button>
				{#each allTeams as team (team)}
					<button
						type="button"
						class={cn(
							"rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition",
							teamFilter === team
								? "bg-primary text-primary-foreground"
								: "bg-muted text-muted-foreground hover:bg-muted/80",
						)}
						onclick={() => (teamFilter = teamFilter === team ? null : team)}
					>
						{team}
					</button>
				{/each}
			</div>

			<!-- Filtered count indicator -->
			{#if isFiltered}
				<p class="text-sm text-muted-foreground">
					Mostrando {filteredStickers.length} figurita{filteredStickers.length !== 1 ? "s" : ""}
				</p>
			{/if}
		</div>
	</div>

	<!-- Team sections grid or empty state -->
	{#if filteredStickers.length === 0}
		<div class="rounded-lg border bg-muted/30 p-8 text-center">
			<p class="text-sm text-muted-foreground">No hay figuritas con esos filtros.</p>
			<button
				type="button"
				class="mt-2 text-sm text-primary underline"
				onclick={resetFilters}
			>
				Limpiar filtros
			</button>
		</div>
	{:else}
		{#each teams as team (team)}
			<section>
				<h2 class="mb-3 text-lg font-semibold">{team}</h2>
				<div class="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
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
