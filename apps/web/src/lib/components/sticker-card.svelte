<script lang="ts">
	import { cn } from "$lib/utils";

	interface Props {
		stickerId: string;
		number: string;
		playerName: string;
		team: string;
		type: string;
		imageUrl: string | null;
		count: number;
		mode: "edit" | "view";
		onIncrement?: () => void;
		onDecrement?: () => void;
	}

	let {
		stickerId,
		number,
		playerName,
		team,
		type,
		imageUrl,
		count,
		mode,
		onIncrement,
		onDecrement,
	}: Props = $props();

	const owned = $derived(count >= 1);
	const dupes = $derived(Math.max(0, count - 1));
	const initials = $derived(
		playerName
			.split(" ")
			.map((p) => p[0])
			.slice(0, 2)
			.join(""),
	);

	const isClickableAsWhole = $derived(mode === "edit" && count === 0);

	const cardClasses = $derived(
		cn(
			"flex flex-col items-center rounded-lg border p-3 transition",
			owned && "border-primary bg-primary/5",
			!owned && "border-dashed bg-muted/30 opacity-60",
			isClickableAsWhole && "cursor-pointer hover:opacity-80 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
		),
	);
</script>

{#snippet body()}
	<div class="relative flex h-20 w-full items-center justify-center rounded bg-muted text-2xl font-bold">
		{#if imageUrl}
			<img src={imageUrl} alt={playerName} class="h-full w-full rounded object-cover" />
		{:else}
			<span class="text-muted-foreground">{initials}</span>
		{/if}
		{#if count >= 2}
			<span
				class="absolute right-1 top-1 rounded-full bg-green-600 px-1.5 py-0.5 text-xs font-bold text-white shadow"
				aria-label="{dupes} repetidas"
			>+{dupes}</span>
		{/if}
	</div>

	<div class="text-center">
		<p class="font-mono text-xs text-muted-foreground">#{number}</p>
		<p class="line-clamp-1 text-sm font-medium">{playerName}</p>
		<p class="text-xs text-muted-foreground">{team}</p>
	</div>
{/snippet}

{#snippet footer()}
	{#if mode === "edit" && count === 0}
		<div class="flex h-12 items-center justify-center gap-1 text-sm text-muted-foreground">
			<span aria-hidden="true">+</span> Agregar
		</div>
	{:else if mode === "edit"}
		<div class="flex h-12 w-full items-center justify-between gap-2">
			<button
				type="button"
				class="flex h-12 w-12 items-center justify-center rounded border text-xl disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				disabled={count <= 0}
				onclick={onDecrement}
				aria-label="Quitar una {playerName}"
			>−</button>
			<span class="text-xl font-bold tabular-nums">{count}</span>
			<button
				type="button"
				class="flex h-12 w-12 items-center justify-center rounded border text-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				onclick={onIncrement}
				aria-label="Sumar una {playerName}"
			>+</button>
		</div>
	{:else}
		<div class="flex h-12 items-center justify-center text-xs">
			{#if count >= 1}Tiene{:else}Le falta{/if}
		</div>
	{/if}
{/snippet}

{#if isClickableAsWhole}
	<button
		type="button"
		onclick={onIncrement}
		class={cardClasses}
		aria-label="Marcar {playerName} como obtenida"
	>
		{@render body()}
		{@render footer()}
	</button>
{:else}
	<div class={cardClasses}>
		{@render body()}
		{@render footer()}
	</div>
{/if}
