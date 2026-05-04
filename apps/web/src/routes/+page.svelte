<script lang="ts">
	import { authClient } from "$lib/auth-client";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import ThemeToggle from "$lib/components/theme-toggle.svelte";

	let { data } = $props();
</script>

{#if data.albums === null}
	<!-- Logged out: landing -->
	<div class="flex min-h-svh items-center justify-center p-6 md:p-10">
		<Card.Root class="mx-auto w-full max-w-sm">
			<Card.Header>
				<Card.Title class="text-2xl">Álbum de Figuritas</Card.Title>
				<Card.Description>Mundial 2026 — registrá las que tenés y las repetidas.</Card.Description>
			</Card.Header>
			<Card.Content class="flex flex-col gap-3 pt-2">
				<Button href="/signup" class="w-full">Crear cuenta</Button>
				<Button href="/login" variant="ghost" class="w-full">Iniciar sesión</Button>
			</Card.Content>
			<Card.Footer class="flex-col items-center gap-2">
				<ThemeToggle />
			</Card.Footer>
		</Card.Root>
	</div>
{:else}
	<!-- Logged in: my albums -->
	<div class="mx-auto max-w-4xl p-6 md:p-10">
		<header class="mb-8 flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold">Hola, {data.user?.name}</h1>
				<p class="text-muted-foreground">Tus álbumes de figuritas</p>
			</div>
			<Button
				variant="outline"
				onclick={async () => {
					await authClient.signOut();
					window.location.href = "/";
				}}
			>
				Cerrar sesión
			</Button>
		</header>

		{#if data.albums.length === 0}
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
