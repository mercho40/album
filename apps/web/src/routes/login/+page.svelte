<script lang="ts">
	import LoginForm from "$lib/components/login-form.svelte";
	import { goto } from "$app/navigation";

	let { data } = $props();
	$effect(() => {
		if (data.user) goto("/", { invalidateAll: true });
	});
</script>

<svelte:head>
	<title>Iniciar sesión · Álbum</title>
	<meta name="description" content="Iniciá sesión para acceder a tus álbumes de figuritas." />
</svelte:head>

<div class="relative flex min-h-svh items-center justify-center p-6 md:p-10">
	<a
		href="/"
		class="absolute top-4 left-4 inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:top-6 md:left-6"
	>
		← Inicio
	</a>
	<LoginForm />
</div>
