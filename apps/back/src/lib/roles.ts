// Predicados de autorización por rol de miembro del álbum.
//
// Roles (del plugin organization de Better Auth): owner, admin, editor.
// El front muestra/oculta controles según el rol, pero estos predicados son la
// fuente de verdad server-side: los handlers NO confían en el front.
//
// Funciones puras, testeables sin DB. `role === null` = no es miembro.

const MANAGER_ROLES = ["owner", "admin"];
const EDITOR_ROLES = ["owner", "admin", "editor"];

/** Puede editar metadata del álbum y agregar/quitar miembros (owner/admin). */
export function isManagerRole(role: string | null): boolean {
  return role !== null && MANAGER_ROLES.includes(role);
}

/** Único que puede eliminar el álbum (owner). */
export function isOwnerRole(role: string | null): boolean {
  return role === "owner";
}

/** Puede marcar figuritas (owner/admin/editor). */
export function isEditorRole(role: string | null): boolean {
  return role !== null && EDITOR_ROLES.includes(role);
}
