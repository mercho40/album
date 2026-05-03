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
	import { untrack } from "svelte";

	let { form } = $props();

	let name = $state(untrack(() => form?.values?.name ?? ""));
	let slug = $state(untrack(() => form?.values?.slug ?? ""));
	let submitting = $state(false);
	let userEditedSlug = $state(false);

	function slugify(s: string) {
		return s
			.toLowerCase()
			.normalize("NFD")
			.replace(/[̀-ͯ]/g, "")
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 64);
	}

	let autoSlug = $derived(slugify(name));

	$effect(() => {
		if (!userEditedSlug) {
			slug = autoSlug;
		}
	});
</script>

<div class="flex min-h-svh items-center justify-center p-6 md:p-10">
	<Card.Root class="mx-auto w-full max-w-md">
		<Card.Header>
			<Card.Title class="text-2xl">Nuevo álbum</Card.Title>
			<Card.Description>Empezá tu colección de figuritas WC 2026</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" onsubmit={() => (submitting = true)}>
				<FieldGroup>
					<Field>
						<FieldLabel for="name">Nombre</FieldLabel>
						<Input id="name" name="name" placeholder="Mi álbum" bind:value={name} required />
					</Field>
					<Field>
						<FieldLabel for="slug">Slug (URL)</FieldLabel>
						<Input
							id="slug"
							name="slug"
							bind:value={slug}
							oninput={() => (userEditedSlug = true)}
							required
						/>
						<FieldDescription>Solo minúsculas, números y guiones.</FieldDescription>
					</Field>
					<Field>
						<FieldLabel for="visibility">Visibilidad</FieldLabel>
						<select
							id="visibility"
							name="visibility"
							class="h-9 rounded-md border bg-background px-3 text-sm"
						>
							<option value="public" selected>Público (aparece en el directorio)</option>
							<option value="unlisted">Solo con el link</option>
							<option value="private">Privado (solo miembros)</option>
						</select>
					</Field>
					{#if form?.error}
						<p class="text-sm text-red-500">{form.error}</p>
					{/if}
					<Field>
						<Button type="submit" class="w-full" disabled={submitting}>
							{submitting ? "Creando..." : "Crear álbum"}
						</Button>
					</Field>
				</FieldGroup>
			</form>
		</Card.Content>
	</Card.Root>
</div>
