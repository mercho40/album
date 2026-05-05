<script lang="ts">
	import { authClient } from "$lib/auth-client";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Skeleton } from "$lib/components/ui/skeleton/index.js";
	import ThemeToggle from "$lib/components/theme-toggle.svelte";
	import { navigating } from "$app/state";

	let { data } = $props();
</script>

<svelte:head>
	{#if data.albums === null}
		<title>Álbum de Figuritas — Mundial 2026</title>
		<meta
			name="description"
			content="Registrá las figuritas que tenés y las repetidas. Compartilo con tu familia. Encontrá con quién intercambiar."
		/>
	{:else}
		<title>Álbum de Figuritas — Mundial 2026</title>
		<meta name="description" content="Tus álbumes de figuritas del Mundial 2026." />
	{/if}
</svelte:head>

{#if data.albums === null}
	<!-- Logged out: landing -->
	<div class="relative min-h-svh">
		<div class="mx-auto flex min-h-svh max-w-3xl flex-col justify-center px-6 py-16 md:px-10">
			<p class="mb-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">Mundial 2026</p>

			<h1 class="text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl">
				Tu álbum del Mundial.
			</h1>

			<p class="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
				Registrá las figuritas que tenés y las repetidas. Compartilo con tu familia. Encontrá con
				quién intercambiar.
			</p>

			<ul class="mt-10 space-y-2 text-sm text-muted-foreground">
				<li class="flex items-start gap-3">
					<span aria-hidden="true" class="select-none">·</span>
					<span>Marcá tu colección sobre las 994 figuritas oficiales del álbum Panini.</span>
				</li>
				<li class="flex items-start gap-3">
					<span aria-hidden="true" class="select-none">·</span>
					<span>Compartí el álbum con familia o amigos para llevar la cuenta entre varios.</span>
				</li>
				<li class="flex items-start gap-3">
					<span aria-hidden="true" class="select-none">·</span>
					<span>Próximamente: matchmaker para encontrar con quién intercambiar.</span>
				</li>
			</ul>

			<div class="mt-12 flex flex-col gap-4 md:flex-row md:items-center">
				<Button href="/signup" class="h-12 w-full px-8 text-base md:w-auto">Crear cuenta</Button>
				<a
					href="/login"
					class="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground md:ml-2"
				>
					¿Ya tenés cuenta? Iniciar sesión
				</a>
			</div>
		</div>

		<div class="fixed bottom-4 right-4">
			<ThemeToggle />
		</div>
	</div>
{:else}
	<!-- Logged in: my albums -->
	<div class="mx-auto max-w-4xl p-6 md:p-10">
		<header class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 class="text-3xl font-bold">Hola, {data.user?.name}</h1>
				<p class="text-muted-foreground">Tus álbumes de figuritas</p>
			</div>
			<div class="flex items-center gap-2">
				<ThemeToggle />
				<Button
					variant="outline"
					onclick={async () => {
						await authClient.signOut();
						window.location.href = "/";
					}}
				>
					Cerrar sesión
				</Button>
			</div>
		</header>

		{#if navigating.to}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each Array(3) as _, i (i)}
					<div class="rounded-lg border p-6">
						<Skeleton class="mb-2 h-6 w-2/3" />
						<Skeleton class="h-4 w-1/3" />
					</div>
				{/each}
			</div>
		{:else if data.albums.length === 0}
			<Card.Root class="mx-auto max-w-md text-center">
				<Card.Header>
					<Card.Title>Empezá tu primer álbum</Card.Title>
					<Card.Description>
						Creá un álbum para registrar tus figuritas y encontrar con quién intercambiar.
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<Button href="/new-album" class="w-full">Crear álbum</Button>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each data.albums as album (album.id)}
					<a href="/albums/{album.slug}">
						<Card.Root class="h-full transition hover:border-primary">
							<Card.Header>
								<Card.Title>{album.name}</Card.Title>
								<Card.Description>{album.visibility} · {album.memberRole}</Card.Description>
							</Card.Header>
							{#if album.description}
								<Card.Content>
									<p class="text-sm text-muted-foreground">{album.description}</p>
								</Card.Content>
							{/if}
						</Card.Root>
					</a>
				{/each}
				<a href="/new-album">
					<Card.Root class="h-full border-dashed transition hover:border-primary">
						<Card.Header class="text-center">
							<Card.Title class="text-muted-foreground">+ Nuevo álbum</Card.Title>
						</Card.Header>
					</Card.Root>
				</a>
			</div>
		{/if}
	</div>
{/if}
