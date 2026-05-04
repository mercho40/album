<script lang="ts">
	import { cn } from "$lib/utils";

	interface Props {
		class?: string;
		children?: import("svelte").Snippet;
	}

	let { class: className, children, ...rest }: Props = $props();
</script>

<div class={cn("animate-pulse rounded-md bg-muted", className)} {...rest}>
	{@render children?.()}
</div>
