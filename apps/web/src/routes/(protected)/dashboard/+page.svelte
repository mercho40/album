<script lang="ts">
	import { authClient } from "$lib/auth-client";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";

	let { data } = $props();
</script>

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
