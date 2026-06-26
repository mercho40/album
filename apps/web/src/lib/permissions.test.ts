import { describe, it, expect } from "bun:test";
import { albumPermissions } from "./permissions";

describe("albumPermissions", () => {
	it("owner puede editar y gestionar", () => {
		expect(albumPermissions("owner")).toEqual({ canEdit: true, canManage: true });
	});

	it("admin puede editar y gestionar", () => {
		expect(albumPermissions("admin")).toEqual({ canEdit: true, canManage: true });
	});

	it("editor puede editar pero no gestionar", () => {
		expect(albumPermissions("editor")).toEqual({ canEdit: true, canManage: false });
	});

	it("visitante (rol null) no puede editar ni gestionar", () => {
		expect(albumPermissions(null)).toEqual({ canEdit: false, canManage: false });
	});

	it("un rol desconocido no habilita nada", () => {
		expect(albumPermissions("viewer")).toEqual({ canEdit: false, canManage: false });
	});
});
