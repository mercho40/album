<script lang="ts">
	import SignupForm from "$lib/components/signup-form.svelte";
	import BackLink from "$lib/components/back-link.svelte";
	import { goto } from "$app/navigation";

	let { data } = $props();
	$effect(() => {
		if (data.user) goto("/", { invalidateAll: true });
	});
</script>

<svelte:head>
	<title>Crear cuenta · Álbum</title>
	<meta name="description" content="Creá tu cuenta para empezar a registrar tus figuritas del Mundial 2026." />
</svelte:head>

<div class="relative flex min-h-svh items-center justify-center p-6 md:p-10">
	<BackLink class="absolute top-2 left-2 md:top-4 md:left-4" />
	<SignupForm />
</div>
