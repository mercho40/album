<script lang="ts">
	import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
	import { toast } from "svelte-sonner";
	import { enhance } from "$app/forms";
	import { untrack } from "svelte";
	import { cn } from "$lib/utils";
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";

	let { data, form } = $props();

	let name = $state(untrack(() => data.album.name));
	let description = $state(untrack(() => data.album.description ?? ""));
	let visibility = $state<"public" | "unlisted" | "private">(
		untrack(() => (data.album.visibility as "public" | "unlisted" | "private") ?? "public"),
	);
	let saving = $state(false);
	let deleting = $state(false);
	let deleteFormEl: HTMLFormElement | undefined = $state();

	const visibilityLabels = {
		public: "Público",
		unlisted: "Solo con el link",
		private: "Privado (solo miembros)",
	} as const;

	$effect(() => {
		if (form?.error) toast.error(form.error);
		if (form?.success) toast.success("Álbum actualizado");
	});
</script>

<svelte:head>
	<title>Configuración · {data.album.name}</title>
</svelte:head>

<a
	href="/albums/{data.album.slug}"
	class="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
>
	<ChevronLeftIcon class="size-4" />
	Volver al álbum
</a>

<div class="max-w-2xl space-y-6">
	<Card.Root>
		<Card.Header>
			<Card.Title>Configuración</Card.Title>
			<Card.Description>Editá el nombre, la descripción y la visibilidad.</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				method="POST"
				action="?/update"
				use:enhance={() => {
					saving = true;
					return async ({ update }) => {
						await update({ reset: false });
						saving = false;
					};
				}}
				class="space-y-4"
			>
				<Field.Field>
					<Field.FieldLabel for="name">Nombre</Field.FieldLabel>
					<Input
						id="name"
						name="name"
						bind:value={name}
						maxlength={64}
						required
					/>
				</Field.Field>

				<Field.Field>
					<Field.FieldLabel for="description">Descripción</Field.FieldLabel>
					<textarea
						id="description"
						name="description"
						bind:value={description}
						maxlength={500}
						rows={3}
						class="border-input bg-transparent placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
					></textarea>
					<p class="text-xs text-muted-foreground">{description.length} / 500</p>
				</Field.Field>

				<Field.Field>
					<Label for="visibility-trigger">Visibilidad</Label>
					<input type="hidden" name="visibility" value={visibility} />
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
				</Field.Field>

				<Button type="submit" disabled={saving}>
					{saving ? "Guardando..." : "Guardar cambios"}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>

	<Card.Root class="border-destructive/40">
		<Card.Header>
			<Card.Title class="text-destructive">Zona de peligro</Card.Title>
			<Card.Description>
				Eliminar el álbum borra todas las figuritas marcadas y a los miembros. No se puede deshacer.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				bind:this={deleteFormEl}
				method="POST"
				action="?/delete"
				use:enhance={() => {
					deleting = true;
					return async ({ update }) => {
						await update();
						deleting = false;
					};
				}}
			>
				<AlertDialog.Root>
					<AlertDialog.Trigger
						type="button"
						disabled={deleting}
						class={cn(buttonVariants({ variant: "destructive" }))}
					>
						{deleting ? "Eliminando..." : "Eliminar álbum"}
					</AlertDialog.Trigger>
					<AlertDialog.Content>
						<AlertDialog.Header>
							<AlertDialog.Title>¿Eliminar "{data.album.name}"?</AlertDialog.Title>
							<AlertDialog.Description>
								Vas a perder todas las figuritas marcadas y los miembros del álbum. Esta acción no
								se puede deshacer.
							</AlertDialog.Description>
						</AlertDialog.Header>
						<AlertDialog.Footer>
							<AlertDialog.Cancel>Cancelar</AlertDialog.Cancel>
							<AlertDialog.Action
								class={cn(buttonVariants({ variant: "destructive" }))}
								onclick={() => deleteFormEl?.requestSubmit()}
							>
								Eliminar
							</AlertDialog.Action>
						</AlertDialog.Footer>
					</AlertDialog.Content>
				</AlertDialog.Root>
			</form>
		</Card.Content>
	</Card.Root>
</div>
