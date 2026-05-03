<script lang="ts">
	import StickerCard from "./sticker-card.svelte";

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

	const groupedByTeam = $derived(
		stickers.reduce<Record<string, StickerRow[]>>((acc, s) => {
			(acc[s.team] ||= []).push(s);
			return acc;
		}, {}),
	);
	const teams = $derived(Object.keys(groupedByTeam).sort());

	const total = $derived(stickers.length);
	const owned = $derived(stickers.filter((s) => s.count >= 1).length);
	const dupes = $derived(stickers.reduce((acc, s) => acc + Math.max(0, s.count - 1), 0));
</script>

<div class="space-y-6">
	<div class="rounded-lg border bg-card p-4">
		<p class="text-sm text-muted-foreground">Progreso</p>
		<p class="text-2xl font-bold tabular-nums">
			{owned} / {total}
			<span class="text-base font-normal text-muted-foreground">
				({dupes} repetida{dupes !== 1 ? "s" : ""})
			</span>
		</p>
		<div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
			<div
				class="h-full bg-primary transition-all"
				style="width: {total === 0 ? 0 : (owned / total) * 100}%"
			></div>
		</div>
	</div>

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
</div>
