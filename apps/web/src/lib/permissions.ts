// Permisos del álbum derivados del rol de miembro.
//
// Función pura (sin dependencias de SvelteKit) para que sea testeable de forma
// aislada y reutilizable entre el load del layout y cualquier otro consumidor.
// Los endpoints del back validan permisos por su cuenta — esto es solo para
// mostrar/ocultar controles en el front.
//
//   - canEdit:   marcar figuritas (owner, admin, editor).
//   - canManage: editar metadata / agregar-quitar miembros / eliminar (owner, admin).
//
// `role === null` = visitante (no miembro): no puede nada.

const EDIT_ROLES = ["owner", "admin", "editor"];
const MANAGE_ROLES = ["owner", "admin"];

export interface AlbumPermissions {
	canEdit: boolean;
	canManage: boolean;
}

export function albumPermissions(role: string | null): AlbumPermissions {
	return {
		canEdit: role !== null && EDIT_ROLES.includes(role),
		canManage: role !== null && MANAGE_ROLES.includes(role),
	};
}
