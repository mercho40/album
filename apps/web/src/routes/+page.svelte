<script lang="ts">
	import { authClient } from "$lib/auth-client";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Empty from "$lib/components/ui/empty/index.js";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { Skeleton } from "$lib/components/ui/skeleton/index.js";
	import ThemeToggle from "$lib/components/theme-toggle.svelte";
	import { navigating } from "$app/state";
	import { userPrefersMode, setMode } from "mode-watcher";
	import LogOutIcon from "@lucide/svelte/icons/log-out";
	import BookOpenIcon from "@lucide/svelte/icons/book-open";
	import SunIcon from "@lucide/svelte/icons/sun";
	import MoonIcon from "@lucide/svelte/icons/moon";
	import MonitorIcon from "@lucide/svelte/icons/monitor";

	let { data } = $props();

	function initials(name?: string | null) {
		if (!name) return "?";
		const parts = name.trim().split(/\s+/).filter(Boolean);
		const first = parts[0]?.[0] ?? "";
		const second = parts[1]?.[0] ?? "";
		return (first + second).toUpperCase() || "?";
	}
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
	<div class="mx-auto max-w-4xl px-4 py-6 md:p-10">
		<header class="mb-8 flex items-start justify-between gap-3">
			<div class="min-w-0">
				<h1 class="truncate text-3xl font-bold">Hola, {data.user?.name}</h1>
				<p class="text-muted-foreground">Tus álbumes de figuritas</p>
			</div>

			<DropdownMenu.Root>
				<DropdownMenu.Trigger
					aria-label="Cuenta"
					class="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
				>
					<Avatar.Root class="size-9">
						{#if data.user?.image}
							<Avatar.Image src={data.user.image} alt={data.user.name ?? ""} />
						{/if}
						<Avatar.Fallback class="text-sm font-medium">
							{initials(data.user?.name)}
						</Avatar.Fallback>
					</Avatar.Root>
				</DropdownMenu.Trigger>

				<DropdownMenu.Content align="end" class="w-64">
					<DropdownMenu.Label class="flex flex-col gap-0.5 font-normal">
						<span class="truncate text-sm font-medium">{data.user?.name}</span>
						{#if data.user?.email}
							<span class="truncate text-xs text-muted-foreground">{data.user.email}</span>
						{/if}
					</DropdownMenu.Label>

					<DropdownMenu.Separator />

					<DropdownMenu.RadioGroup
						value={userPrefersMode.current}
						onValueChange={(v) => setMode(v as "light" | "dark" | "system")}
					>
						<DropdownMenu.GroupHeading>Tema</DropdownMenu.GroupHeading>
						<DropdownMenu.RadioItem value="light">
							<SunIcon />
							Claro
						</DropdownMenu.RadioItem>
						<DropdownMenu.RadioItem value="dark">
							<MoonIcon />
							Oscuro
						</DropdownMenu.RadioItem>
						<DropdownMenu.RadioItem value="system">
							<MonitorIcon />
							Sistema
						</DropdownMenu.RadioItem>
					</DropdownMenu.RadioGroup>

					<DropdownMenu.Separator />

					<DropdownMenu.Item
						variant="destructive"
						onclick={async () => {
							await authClient.signOut();
							window.location.href = "/";
						}}
					>
						<LogOutIcon />
						Cerrar sesión
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</header>

		{#if navigating.to?.url.pathname === "/"}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-live="polite">
				{#each Array(3) as _, i (i)}
					<div class="rounded-xl border bg-card p-6">
						<Skeleton class="mb-2 h-5 w-3/5" />
						<Skeleton class="h-4 w-2/5" />
					</div>
				{/each}
				<div class="flex min-h-[7rem] items-center justify-center rounded-xl border border-dashed">
					<Skeleton class="h-4 w-28" />
				</div>
			</div>
		{:else if data.albums.length === 0}
			<Empty.Root class="mx-auto max-w-md rounded-lg border">
				<Empty.Header>
					<Empty.Media variant="icon">
						<BookOpenIcon />
					</Empty.Media>
					<Empty.Title>Empezá tu primer álbum</Empty.Title>
					<Empty.Description>
						Creá un álbum para registrar tus figuritas y encontrar con quién intercambiar.
					</Empty.Description>
				</Empty.Header>
				<Empty.Content>
					<Button href="/new-album">Crear álbum</Button>
				</Empty.Content>
			</Empty.Root>
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
				<a href="/new-album" class="block">
					<Card.Root
						class="flex h-full min-h-[7rem] items-center justify-center border-dashed transition hover:border-primary"
					>
						<p class="text-sm font-medium text-muted-foreground">+ Nuevo álbum</p>
					</Card.Root>
				</a>
			</div>
		{/if}
	</div>
{/if}
