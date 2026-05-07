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
		number,
		playerName,
		count,
		mode,
		onIncrement,
		onDecrement,
	}: Props = $props();

	const owned = $derived(count >= 1);
	const dupes = $derived(Math.max(0, count - 1));
	const isClickableAsWhole = $derived(mode === "edit" && count === 0);

	const cardClasses = $derived(
		cn(
			"relative flex flex-col items-center justify-between gap-1 rounded-lg border p-2 text-center transition",
			owned ? "border-foreground/40 bg-foreground/[0.03]" : "border-dashed border-border opacity-60",
			isClickableAsWhole &&
				"cursor-pointer hover:opacity-80 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
		),
	);
</script>

{#snippet body()}
	{#if count >= 2}
		<span
			class="absolute right-1 top-1 text-[10px] font-medium leading-none tabular-nums text-muted-foreground"
			aria-label="{dupes} repetidas"
		>
			+{dupes}
		</span>
	{/if}

	<div class="flex flex-col items-center pt-1">
		<span class="font-mono text-3xl font-bold leading-none tabular-nums tracking-tight">
			{number}
		</span>
		<span class="mt-1 line-clamp-1 max-w-full text-xs text-muted-foreground">
			{playerName}
		</span>
	</div>
{/snippet}

{#snippet footer()}
	{#if mode === "edit" && count === 0}
		<span class="text-[11px] text-muted-foreground">+ agregar</span>
	{:else if mode === "edit"}
		<div class="flex w-full items-center justify-between gap-1">
			<button
				type="button"
				class="flex size-7 items-center justify-center rounded border text-base leading-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				disabled={count <= 0}
				onclick={onDecrement}
				aria-label="Quitar una {playerName}"
			>−</button>
			<span class="text-sm font-semibold tabular-nums">{count}</span>
			<button
				type="button"
				class="flex size-7 items-center justify-center rounded border text-base leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				onclick={onIncrement}
				aria-label="Sumar una {playerName}"
			>+</button>
		</div>
	{:else}
		<span class="text-[11px] text-muted-foreground">
			{count >= 1 ? "tiene" : "le falta"}
		</span>
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
