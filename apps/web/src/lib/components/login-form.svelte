<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import {
		FieldGroup,
		Field,
		FieldLabel,
		FieldDescription,
	} from "$lib/components/ui/field/index.js";
	import { authClient } from "$lib/auth-client";
	import { toast } from "svelte-sonner";

	const id = $props.id();

	let email = $state("");
	let password = $state("");
	let loading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		await authClient.signIn.email(
			{ email, password },
			{
				onSuccess: () => {
					window.location.href = "/";
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
		<Card.Title class="text-2xl">Login</Card.Title>
		<Card.Description>Enter your email below to login to your account</Card.Description>
	</Card.Header>
	<Card.Content>
		<form onsubmit={handleSubmit}>
			<FieldGroup>
				<Field>
					<FieldLabel for="email-{id}">Email</FieldLabel>
					<Input id="email-{id}" type="email" placeholder="m@example.com" required bind:value={email} />
				</Field>
				<Field>
					<div class="flex items-center">
						<FieldLabel for="password-{id}">Password</FieldLabel>
						<!-- <a href="/forgot-password" class="ms-auto inline-block text-sm underline"> -->
						<!-- 	Forgot your password? -->
						<!-- </a> -->
					</div>
					<Input id="password-{id}" type="password" required bind:value={password} />
				</Field>
				<Field>
					<Button type="submit" class="w-full" disabled={loading}>
						{loading ? "Logging in..." : "Login"}
					</Button>
					<Button
						variant="outline"
						class="w-full"
						type="button"
						onclick={() =>
							authClient.signIn.social({
								provider: "google",
								callbackURL: `${window.location.origin}/`,
							})}
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
							<path
								d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
								fill="currentColor"
							/>
						</svg>
						Login with Google
					</Button>
					<FieldDescription class="text-center">
						Don't have an account? <a href="/signup" class="underline">Sign up</a>
					</FieldDescription>
				</Field>
			</FieldGroup>
		</form>
	</Card.Content>
</Card.Root>
