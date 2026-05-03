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
</script>

<div
	class={cn(
		"flex flex-col items-center gap-2 rounded-lg border p-3 transition",
		owned && "border-primary bg-primary/5",
		!owned && "border-dashed bg-muted/30 opacity-60",
	)}
>
	<div class="flex h-20 w-full items-center justify-center rounded bg-muted text-2xl font-bold">
		{#if imageUrl}
			<img src={imageUrl} alt={playerName} class="h-full w-full rounded object-cover" />
		{:else}
			<span class="text-muted-foreground">{initials}</span>
		{/if}
	</div>

	<div class="text-center">
		<p class="font-mono text-xs text-muted-foreground">#{number}</p>
		<p class="line-clamp-1 text-sm font-medium">{playerName}</p>
		<p class="text-xs text-muted-foreground">{team}</p>
	</div>

	{#if mode === "edit"}
		<div class="flex w-full items-center justify-between gap-2">
			<button
				type="button"
				class="flex h-8 w-8 items-center justify-center rounded border text-lg disabled:opacity-30"
				disabled={count === 0}
				onclick={onDecrement}
				aria-label="Quitar una"
			>
				−
			</button>
			<span class="text-sm tabular-nums">
				{count}
				{#if dupes > 0}
					<span class="text-xs text-green-600">(+{dupes})</span>
				{/if}
			</span>
			<button
				type="button"
				class="flex h-8 w-8 items-center justify-center rounded border text-lg"
				onclick={onIncrement}
				aria-label="Sumar una"
			>
				+
			</button>
		</div>
	{:else}
		<p class="text-xs">
			{#if owned}
				Tiene{#if dupes > 0}
					<span> (+{dupes} repetida{dupes > 1 ? "s" : ""})</span>
				{/if}
			{:else}
				Le falta
			{/if}
		</p>
	{/if}
</div>
