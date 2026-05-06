<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { authClient } from "$lib/auth-client";
	import { toast } from "svelte-sonner";
	import Eye from "@lucide/svelte/icons/eye";
	import EyeOff from "@lucide/svelte/icons/eye-off";

	let email = $state("");
	let password = $state("");
	let showPassword = $state(false);
	let loading = $state(false);

	function nameFromEmail(value: string) {
		const local = value.split("@")[0] ?? "";
		return local.replace(/[._-]+/g, " ").trim() || value;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		await authClient.signUp.email(
			{ email, password, name: nameFromEmail(email) },
			{
				onSuccess: () => {
					window.location.href = "/new-album";
				},
				onError: (ctx) => {
					toast.error(ctx.error.message);
				},
			},
		);
		loading = false;
	}
</script>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header>
		<Card.Title>Crear cuenta</Card.Title>
		<Card.Description>Ingresá tu email y elegí una contraseña.</Card.Description>
	</Card.Header>
	<Card.Content>
		<form onsubmit={handleSubmit}>
			<Field.Group>
				<Field.Field>
					<Field.Label for="email">Email</Field.Label>
					<Input
						id="email"
						type="email"
						placeholder="m@example.com"
						required
						bind:value={email}
					/>
				</Field.Field>
				<Field.Field>
					<Field.Label for="password">Contraseña</Field.Label>
					<div class="relative">
						<Input
							id="password"
							type={showPassword ? "text" : "password"}
							required
							minlength={8}
							bind:value={password}
							class="pr-10"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute inset-y-0 right-0 flex h-full w-10 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-md"
							aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
						>
							{#if showPassword}
								<EyeOff class="size-4" />
							{:else}
								<Eye class="size-4" />
							{/if}
						</button>
					</div>
					<Field.Description>Mínimo 8 caracteres.</Field.Description>
				</Field.Field>
				<Field.Group>
					<Field.Field>
						<Button type="submit" class="w-full" disabled={loading}>
							{loading ? "Creando cuenta..." : "Crear cuenta"}
						</Button>
						<Button
							variant="outline"
							class="w-full"
							type="button"
							onclick={() =>
								authClient.signIn.social({
									provider: "google",
									callbackURL: `${window.location.origin}/new-album`,
								})}
						>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
								<path
									d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
									fill="currentColor"
								/>
							</svg>
							Continuar con Google
						</Button>
						<Field.Description class="px-6 text-center">
							¿Ya tenés cuenta? <a href="/login" class="underline">Ingresá</a>
						</Field.Description>
					</Field.Field>
				</Field.Group>
			</Field.Group>
		</form>
	</Card.Content>
</Card.Root>
