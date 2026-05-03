<script lang="ts">
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";

	const status = $derived(page.status);
	const message = $derived(page.error?.message ?? "");

	const title = $derived(
		status === 404
			? "No encontramos esto"
			: status >= 500
			? "Algo se rompió"
			: status === 401 || status === 403
			? "No tenés acceso"
			: "Algo salió mal",
	);

	const description = $derived(
		status === 404
			? "La página que buscás no existe o se movió."
			: status >= 500
			? "Hubo un problema en el servidor. Probá de nuevo en un rato."
			: status === 401 || status === 403
			? "Necesitás permisos para ver esto."
			: message || "Volvé al inicio o probá otra acción.",
	);
</script>

<div class="flex min-h-svh items-center justify-center p-6 md:p-10">
	<Card.Root class="mx-auto w-full max-w-md text-center">
		<Card.Header>
			<p class="font-mono text-sm text-muted-foreground">Error {status}</p>
			<Card.Title class="text-2xl">{title}</Card.Title>
			<Card.Description>{description}</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-2">
			<Button onclick={() => history.back()} variant="outline" class="w-full">Volver</Button>
			<Button href="/" class="w-full">Ir al inicio</Button>
		</Card.Content>
	</Card.Root>
</div>
