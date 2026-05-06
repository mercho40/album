<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import {
		FieldGroup,
		Field,
		FieldLabel,
	} from "$lib/components/ui/field/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import { untrack } from "svelte";
	import { toast } from "svelte-sonner";

	let { form } = $props();

	$effect(() => {
		if (form?.error) {
			toast.error(form.error);
		}
	});

	let name = $state(untrack(() => form?.values?.name ?? ""));
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

	const slug = $derived(slugify(name));

	const visibilityLabels = {
		public: "Público",
		unlisted: "Solo con el link",
		private: "Privado (solo miembros)",
	} as const;
</script>

<svelte:head>
	<title>Nuevo álbum · Álbum</title>
	<meta name="description" content="Creá un álbum para registrar tus figuritas y compartirlo con tu familia." />
</svelte:head>

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
					<input type="hidden" name="slugAuto" value="true" />

					<Field>
						<FieldLabel for="visibility-trigger">Visibilidad</FieldLabel>
						<Select.Root type="single" bind:value={visibility as string}>
							<Select.Trigger id="visibility-trigger" class="w-full">
								{visibilityLabels[visibility]}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="public">Público</Select.Item>
								<Select.Item value="unlisted">Solo con el link</Select.Item>
								<Select.Item value="private">Privado (solo miembros)</Select.Item>
							</Select.Content>
						</Select.Root>
					</Field>

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
