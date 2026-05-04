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
	import { toast } from "svelte-sonner";

	let { form } = $props();

	$effect(() => {
		if (form?.error) {
			toast.error(form.error);
		}
	});

	let name = $state(untrack(() => form?.values?.name ?? ""));
	let manualSlug = $state(untrack(() => form?.values?.slug ?? ""));
	let userEditedSlug = $state(false);
	let visibility = $state<"public" | "unlisted" | "private">("public");
	let submitting = $state(false);

	function slugify(s: string) {
		return s
			.toLowerCase()
			.normalize("NFD")
			.replace(/[̀-ͯ]/g, "")
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 64);
	}

	let slug = $derived(userEditedSlug ? manualSlug : slugify(name));
</script>

<div class="flex min-h-svh items-center justify-center p-6 md:p-10">
	<Card.Root class="mx-auto w-full max-w-md">
		<Card.Header>
			<Card.Title class="text-2xl">Nuevo álbum</Card.Title>
			<Card.Description>Dale un nombre y empezá a marcar figuritas.</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" onsubmit={() => (submitting = true)}>
				<FieldGroup>
					<Field>
						<FieldLabel for="name">Nombre</FieldLabel>
						<Input id="name" name="name" placeholder="Mi álbum" bind:value={name} required />
					</Field>

					<input type="hidden" name="slug" value={slug} />
					<input type="hidden" name="visibility" value={visibility} />

					<details class="group">
						<summary class="cursor-pointer text-sm text-muted-foreground select-none">
							Opciones avanzadas
						</summary>
						<div class="mt-3 space-y-4">
							<Field>
								<FieldLabel for="slug-edit">Slug (URL)</FieldLabel>
								<Input
									id="slug-edit"
									value={slug}
									oninput={(e) => {
										userEditedSlug = true;
										manualSlug = (e.target as HTMLInputElement).value;
									}}
								/>
								<FieldDescription>Solo minúsculas, números y guiones.</FieldDescription>
							</Field>
							<Field>
								<FieldLabel for="visibility-edit">Visibilidad</FieldLabel>
								<select
									id="visibility-edit"
									bind:value={visibility}
									class="h-9 rounded-md border bg-background px-3 text-sm"
								>
									<option value="public">Público</option>
									<option value="unlisted">Solo con el link</option>
									<option value="private">Privado</option>
								</select>
							</Field>
						</div>
					</details>

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
