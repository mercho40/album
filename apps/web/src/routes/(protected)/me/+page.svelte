<script lang="ts">
	import { authClient } from "$lib/auth-client";
	import { createApi } from "$lib/api";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import BackLink from "$lib/components/back-link.svelte";
	import { toast } from "svelte-sonner";
	import { untrack } from "svelte";

	let { data } = $props();

	const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
	const MAX_BYTES = 4 * 1024 * 1024;

	// ── Perfil ──────────────────────────────────────────────
	let name = $state(untrack(() => data.user?.name ?? ""));
	let image = $state(untrack(() => data.user?.image ?? ""));
	let selectedFile = $state<File | null>(null);
	let previewUrl = $state<string | null>(null);
	let savingProfile = $state(false);
	let fileInput = $state<HTMLInputElement>();

	let initials = $derived.by(() => {
		const source = name || data.user?.email || "";
		const parts = source.trim().split(/\s+/).filter(Boolean);
		return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
	});

	function onFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		if (!ACCEPTED.includes(file.type)) {
			toast.error("Formato no soportado. Usá JPG, PNG, WEBP o GIF.");
			input.value = "";
			return;
		}
		if (file.size > MAX_BYTES) {
			toast.error("La imagen supera los 4 MB.");
			input.value = "";
			return;
		}
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		selectedFile = file;
		previewUrl = URL.createObjectURL(file);
	}

	function removePhoto() {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = null;
		selectedFile = null;
		image = "";
		if (fileInput) fileInput.value = "";
	}

	async function saveProfile(e: Event) {
		e.preventDefault();
		savingProfile = true;
		try {
			let imageUrl = image.trim();

			if (selectedFile) {
				const api = createApi(fetch);
				const { data: uploaded, error } = await api.avatar.post({ file: selectedFile });
				if (error) {
					toast.error("No se pudo subir la imagen. Probá de nuevo.");
					return;
				}
				imageUrl = uploaded.url;
			}

			await authClient.updateUser(
				{ name: name.trim(), image: imageUrl },
				{
					onSuccess: () => {
						image = imageUrl;
						if (previewUrl) URL.revokeObjectURL(previewUrl);
						previewUrl = null;
						selectedFile = null;
						if (fileInput) fileInput.value = "";
						toast.success("Perfil actualizado");
					},
					onError: (ctx) => {
						toast.error(ctx.error.message);
					},
				},
			);
		} finally {
			savingProfile = false;
		}
	}

	// ── Seguridad: cambiar contraseña ───────────────────────
	let currentPassword = $state("");
	let newPassword = $state("");
	let changingPassword = $state(false);

	async function changePassword(e: Event) {
		e.preventDefault();
		changingPassword = true;
		await authClient.changePassword(
			{ currentPassword, newPassword, revokeOtherSessions: true },
			{
				onSuccess: () => {
					toast.success("Contraseña actualizada");
					currentPassword = "";
					newPassword = "";
				},
				onError: (ctx) => {
					toast.error(ctx.error.message);
				},
			},
		);
		changingPassword = false;
	}

	// ── Sesión ──────────────────────────────────────────────
	let signingOut = $state(false);

	async function signOut() {
		signingOut = true;
		await authClient.signOut();
		window.location.href = "/";
	}
</script>

<svelte:head>
	<title>Perfil y cuenta · Álbum</title>
</svelte:head>

<div class="relative min-h-svh">
	<BackLink class="absolute top-2 left-2 md:top-4 md:left-4" />

	<div class="mx-auto max-w-2xl space-y-6 px-4 py-16 md:px-10">
		<div>
			<h1 class="text-3xl font-bold">Perfil y cuenta</h1>
			<p class="text-muted-foreground">Editá tus datos y la seguridad de tu cuenta.</p>
		</div>

		<!-- Perfil -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Perfil</Card.Title>
				<Card.Description>Tu nombre y foto, visibles en los álbumes que compartís.</Card.Description>
			</Card.Header>
			<Card.Content>
				<form onsubmit={saveProfile} class="space-y-4">
					<Field.Field>
						<Field.FieldLabel for="name">Nombre</Field.FieldLabel>
						<Input id="name" bind:value={name} maxlength={64} required />
					</Field.Field>

					<Field.Field>
						<Field.FieldLabel>Foto</Field.FieldLabel>
						<div class="flex items-center gap-4">
							<Avatar.Root class="size-16">
								{#if previewUrl || image}
									<Avatar.Image src={previewUrl || image} alt={name} />
								{/if}
								<Avatar.Fallback class="text-lg font-medium">{initials}</Avatar.Fallback>
							</Avatar.Root>
							<div class="flex flex-col gap-2">
								<div class="flex gap-2">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onclick={() => fileInput?.click()}
									>
										Cambiar foto
									</Button>
									{#if previewUrl || image}
										<Button type="button" variant="ghost" size="sm" onclick={removePhoto}>
											Quitar
										</Button>
									{/if}
								</div>
								<Field.FieldDescription>JPG, PNG, WEBP o GIF. Máx. 4 MB.</Field.FieldDescription>
							</div>
						</div>
						<input
							bind:this={fileInput}
							type="file"
							accept="image/jpeg,image/png,image/webp,image/gif"
							class="hidden"
							onchange={onFileChange}
						/>
					</Field.Field>

					<Field.Field>
						<Field.FieldLabel for="email">Email</Field.FieldLabel>
						<Input id="email" type="email" value={data.user?.email ?? ""} disabled readonly />
						<Field.FieldDescription>El email no se puede cambiar por ahora.</Field.FieldDescription>
					</Field.Field>

					<Button type="submit" disabled={savingProfile}>
						{savingProfile ? "Guardando…" : "Guardar cambios"}
					</Button>
				</form>
			</Card.Content>
		</Card.Root>

		<!-- Seguridad -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Seguridad</Card.Title>
				<Card.Description>
					Cambiá tu contraseña. Aplica solo si te registraste con email y contraseña.
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<form onsubmit={changePassword} class="space-y-4">
					<Field.Field>
						<Field.FieldLabel for="currentPassword">Contraseña actual</Field.FieldLabel>
						<Input
							id="currentPassword"
							type="password"
							bind:value={currentPassword}
							autocomplete="current-password"
							required
						/>
					</Field.Field>
					<Field.Field>
						<Field.FieldLabel for="newPassword">Nueva contraseña</Field.FieldLabel>
						<Input
							id="newPassword"
							type="password"
							bind:value={newPassword}
							autocomplete="new-password"
							minlength={8}
							required
						/>
					</Field.Field>
					<Button type="submit" disabled={changingPassword}>
						{changingPassword ? "Cambiando…" : "Cambiar contraseña"}
					</Button>
				</form>
			</Card.Content>
		</Card.Root>

		<!-- Sesión -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Sesión</Card.Title>
				<Card.Description>Cerrá la sesión en este dispositivo.</Card.Description>
			</Card.Header>
			<Card.Content>
				<Button variant="outline" disabled={signingOut} onclick={signOut}>
					{signingOut ? "Cerrando…" : "Cerrar sesión"}
				</Button>
			</Card.Content>
		</Card.Root>
	</div>
</div>
