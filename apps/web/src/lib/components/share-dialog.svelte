<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Skeleton } from "$lib/components/ui/skeleton/index.js";
	import { PUBLIC_API_URL } from "$env/static/public";
	import { goto } from "$app/navigation";
	import { toast } from "svelte-sonner";
	import { cn } from "$lib/utils";
	import UsersIcon from "@lucide/svelte/icons/users";
	import XIcon from "@lucide/svelte/icons/x";
	import LogOutIcon from "@lucide/svelte/icons/log-out";

	interface Member {
		userId: string;
		name: string;
		email: string;
		image: string | null;
		role: string;
		joinedAt: string | Date;
	}

	interface Props {
		albumSlug: string;
		canManage: boolean;
		currentUserId: string | undefined;
		currentUserRole: string | null;
	}

	let { albumSlug, canManage, currentUserId, currentUserRole }: Props = $props();

	let open = $state(false);
	let members = $state<Member[]>([]);
	let loading = $state(false);
	let loaded = $state(false);
	let listError = $state<string | null>(null);

	let email = $state("");
	let submitting = $state(false);
	let submitError = $state<string | null>(null);

	function initials(name: string) {
		const parts = name.trim().split(/\s+/).filter(Boolean);
		return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
	}

	function roleLabel(role: string) {
		if (role === "owner") return "Propietario";
		if (role === "admin") return "Admin";
		return "Editor";
	}

	async function loadMembers() {
		loading = true;
		listError = null;
		try {
			const res = await fetch(`${PUBLIC_API_URL}/albums/${albumSlug}/members`, {
				credentials: "include",
			});
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				listError = body?.error?.message ?? "No se pudo cargar la lista de miembros.";
				return;
			}
			members = await res.json();
			loaded = true;
		} catch {
			listError = "No se pudo cargar la lista de miembros.";
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (open && !loaded && !loading && !listError) {
			loadMembers();
		}
	});

	async function addMember(e: Event) {
		e.preventDefault();
		const trimmed = email.trim();
		if (!trimmed) return;
		submitting = true;
		submitError = null;
		try {
			const res = await fetch(`${PUBLIC_API_URL}/albums/${albumSlug}/members`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: trimmed }),
			});
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				submitError = body?.error?.message ?? "No se pudo agregar.";
				return;
			}
			const newMember: Member = await res.json();
			members = [...members, newMember];
			email = "";
			toast.success(`${newMember.name} agregado al álbum`);
		} catch {
			submitError = "No se pudo agregar.";
		} finally {
			submitting = false;
		}
	}

	async function removeMember(userId: string, name: string) {
		const isSelf = userId === currentUserId;
		const message = isSelf
			? "¿Salir del álbum? Vas a perder acceso."
			: `¿Quitar a ${name} del álbum?`;
		if (!confirm(message)) return;

		const prev = members;
		members = members.filter((m) => m.userId !== userId);

		try {
			const res = await fetch(`${PUBLIC_API_URL}/albums/${albumSlug}/members/${userId}`, {
				method: "DELETE",
				credentials: "include",
			});
			if (!res.ok) {
				members = prev;
				const body = await res.json().catch(() => null);
				toast.error(body?.error?.message ?? "No se pudo quitar al miembro.");
				return;
			}
			if (isSelf) {
				toast.success("Saliste del álbum");
				open = false;
				await goto("/", { invalidateAll: true });
			} else {
				toast.success(`${name} fue quitado`);
			}
		} catch {
			members = prev;
			toast.error("No se pudo quitar al miembro.");
		}
	}

	const isEditor = $derived(currentUserRole !== null && currentUserRole !== "owner");
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger
		aria-label="Compartir"
		class={cn(
			buttonVariants({ variant: "ghost", size: "icon" }),
			"size-11 shrink-0",
		)}
	>
		<UsersIcon class="size-5" />
	</Dialog.Trigger>

	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Miembros</Dialog.Title>
			<Dialog.Description>
				Compartí el álbum con familia o amigos. Pueden marcar figuritas igual que vos.
			</Dialog.Description>
		</Dialog.Header>

		<!-- Member list -->
		<div class="space-y-2">
			{#if loading}
				{#each Array(3) as _, i (i)}
					<div class="flex items-center gap-3 py-2">
						<Skeleton class="size-9 rounded-full" />
						<div class="flex flex-1 flex-col gap-1">
							<Skeleton class="h-4 w-32" />
							<Skeleton class="h-3 w-44" />
						</div>
					</div>
				{/each}
			{:else if listError}
				<p class="text-sm text-destructive">{listError}</p>
				<Button variant="outline" size="sm" onclick={loadMembers}>Reintentar</Button>
			{:else}
				{#each members as m (m.userId)}
					<div class="flex items-center gap-3 py-1.5">
						<Avatar.Root class="size-9 shrink-0">
							{#if m.image}
								<Avatar.Image src={m.image} alt={m.name} />
							{/if}
							<Avatar.Fallback class="text-xs">{initials(m.name)}</Avatar.Fallback>
						</Avatar.Root>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">
								{m.name}
								{#if m.userId === currentUserId}
									<span class="text-muted-foreground">· vos</span>
								{/if}
							</p>
							<p class="truncate text-xs text-muted-foreground">{m.email}</p>
						</div>
						<span
							class="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
						>
							{roleLabel(m.role)}
						</span>
						{#if canManage && m.role !== "owner" && m.userId !== currentUserId}
							<Button
								variant="ghost"
								size="icon"
								class="size-8 shrink-0"
								aria-label="Quitar a {m.name}"
								onclick={() => removeMember(m.userId, m.name)}
							>
								<XIcon class="size-4" />
							</Button>
						{/if}
					</div>
				{/each}
			{/if}
		</div>

		<!-- Add member form (owner only) -->
		{#if canManage}
			<form onsubmit={addMember} class="space-y-2 border-t pt-4">
				<label class="text-xs font-medium uppercase tracking-wide text-muted-foreground" for="member-email">
					Agregar por email
				</label>
				<div class="flex gap-2">
					<Input
						id="member-email"
						type="email"
						placeholder="email@ejemplo.com"
						bind:value={email}
						disabled={submitting}
						required
					/>
					<Button type="submit" disabled={submitting || !email.trim()}>
						{submitting ? "Agregando..." : "Agregar"}
					</Button>
				</div>
				{#if submitError}
					<p class="text-xs text-destructive">{submitError}</p>
				{/if}
			</form>
		{/if}

		<!-- Self-leave (editor only) -->
		{#if isEditor && currentUserId}
			<div class="border-t pt-4">
				<Button
					variant="ghost"
					size="sm"
					class="text-destructive hover:bg-destructive/10 hover:text-destructive"
					onclick={() => removeMember(currentUserId!, "vos")}
				>
					<LogOutIcon class="size-4" />
					Salir del álbum
				</Button>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
