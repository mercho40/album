<script lang="ts">
	import LoginForm from "$lib/components/login-form.svelte";
	import BackLink from "$lib/components/back-link.svelte";
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
	<BackLink class="absolute top-2 left-2 md:top-4 md:left-4" />
	<LoginForm />
</div>
