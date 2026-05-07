<script lang="ts">
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import { cn } from "$lib/utils";

	interface Props {
		href?: string;
		label?: string;
		class?: string;
	}

	let { href = "/", label = "Inicio", class: className = "" }: Props = $props();
</script>

<a
	{href}
	aria-label={label}
	class={cn(
		"inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
		className,
	)}
>
	<ChevronLeftIcon class="size-7" />
</a>
