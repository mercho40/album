<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils";
	import { COUNTRY_CODES } from "$lib/data/country-codes";
	import ChartPieIcon from "@lucide/svelte/icons/chart-pie";

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
	}

	let { stickers }: Props = $props();

	// Golden = badge (shield #1 of each country)
	// Team   = #13 of each real country (team photo)
	// Common = everything else
	function classify(s: StickerRow): "golden" | "team" | "common" {
		if (s.type === "badge") return "golden";
		const numSuffix = s.number.match(/\d+$/)?.[0];
		if (numSuffix === "13" && s.team in COUNTRY_CODES) return "team";
		return "common";
	}

	const stats = $derived.by(() => {
		const g = { owned: 0, total: 0 };
		const t = { owned: 0, total: 0 };
		const c = { owned: 0, total: 0 };
		for (const s of stickers) {
			const kind = classify(s);
			if (kind === "golden") {
				g.total++;
				if (s.count > 0) g.owned++;
			} else if (kind === "team") {
				t.total++;
				if (s.count > 0) t.owned++;
			} else {
				c.total++;
				if (s.count > 0) c.owned++;
			}
		}
		const total = g.total + t.total + c.total;
		const totalOwned = g.owned + t.owned + c.owned;
		const missing = total - totalOwned;
		const pct = total > 0 ? Math.round((totalOwned / total) * 100) : 0;
		return { golden: g, team: t, common: c, total, totalOwned, missing, pct };
	});

	// Donut chart via SVG
	const R = 40;
	const CX = 50;
	const CY = 50;
	const STROKE = 10;
	const C = 2 * Math.PI * R; // ≈ 251.33

	interface Seg {
		color: string;
		length: number;
		startAngle: number; // degrees, 0 = 12-o-clock
	}

	const chartSegments = $derived.by((): Seg[] => {
		const { golden, team, common, total, missing } = stats;
		if (total === 0) return [];
		const toLen = (n: number) => (n / total) * C;
		const raw = [
			{ color: "#EAB308", length: toLen(golden.owned) },
			{ color: "#3B82F6", length: toLen(team.owned) },
			{ color: "#22C55E", length: toLen(common.owned) },
			{ color: "oklch(0.75 0 0)", length: toLen(missing) },
		].filter((s) => s.length > 0.01);

		let cumAngle = 0;
		return raw.map((s) => {
			const seg = { ...s, startAngle: cumAngle };
			cumAngle += (s.length / C) * 360;
			return seg;
		});
	});

	function pct(owned: number, total: number) {
		return total > 0 ? Math.round((owned / total) * 100) : 0;
	}
</script>

<Dialog.Root>
	<Dialog.Trigger
		aria-label="Estadísticas del álbum"
		class={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-11 shrink-0")}
	>
		<ChartPieIcon class="size-5" />
	</Dialog.Trigger>

	<Dialog.Content class="sm:max-w-sm">
		<Dialog.Header>
			<Dialog.Title>Estadísticas</Dialog.Title>
			<Dialog.Description>Progreso de tu álbum del Mundial 2026.</Dialog.Description>
		</Dialog.Header>

		<!-- Donut chart -->
		<div class="flex justify-center py-2">
			<div class="relative size-44">
				<svg viewBox="0 0 100 100" class="size-full">
					{#if stats.total === 0 || chartSegments.length === 0}
						<!-- Empty ring while loading or no stickers -->
						<circle
							cx={CX}
							cy={CY}
							r={R}
							fill="none"
							stroke="oklch(0.75 0 0)"
							stroke-width={STROKE}
						/>
					{:else}
						{#each chartSegments as seg (seg.color + seg.startAngle)}
							<circle
								cx={CX}
								cy={CY}
								r={R}
								fill="none"
								stroke={seg.color}
								stroke-width={STROKE}
								stroke-dasharray={`${seg.length} ${C - seg.length}`}
								transform={`rotate(${-90 + seg.startAngle} ${CX} ${CY})`}
							/>
						{/each}
					{/if}
				</svg>
				<!-- Center label -->
				<div class="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
					<span class="text-3xl font-bold leading-none">{stats.pct}%</span>
					<span class="text-xs text-muted-foreground tabular-nums">
						{stats.totalOwned}/{stats.total}
					</span>
				</div>
			</div>
		</div>

		<!-- Breakdown -->
		<div class="rounded-lg border">
			{#each [
				{ label: "Doradas (escudo)", color: "#EAB308", group: stats.golden },
				{ label: "Foto de equipo (#13)", color: "#3B82F6", group: stats.team },
				{ label: "Comunes", color: "#22C55E", group: stats.common },
			] as row, i (row.label)}
				<div class={cn("flex items-center gap-3 px-3 py-2.5", i > 0 && "border-t")}>
					<span class="size-3 shrink-0 rounded-full" style="background:{row.color}"></span>
					<span class="min-w-0 flex-1 text-sm">{row.label}</span>
					<span class="text-sm font-semibold tabular-nums">
						{row.group.owned}<span class="text-muted-foreground font-normal">/{row.group.total}</span>
					</span>
					<span class="w-9 text-right text-xs text-muted-foreground tabular-nums">
						{pct(row.group.owned, row.group.total)}%
					</span>
				</div>
			{/each}
			<div class="flex items-center gap-3 border-t px-3 py-2.5">
				<span class="size-3 shrink-0 rounded-full" style="background:oklch(0.75 0 0)"></span>
				<span class="min-w-0 flex-1 text-sm text-muted-foreground">Faltantes</span>
				<span class="text-sm font-semibold tabular-nums text-muted-foreground">
					{stats.missing}<span class="font-normal">/{stats.total}</span>
				</span>
				<span class="w-9 text-right text-xs text-muted-foreground tabular-nums">
					{pct(stats.missing, stats.total)}%
				</span>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
