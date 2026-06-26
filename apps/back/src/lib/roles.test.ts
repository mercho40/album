import { describe, it, expect } from "bun:test";
import { isManagerRole, isOwnerRole, isEditorRole } from "./roles";

describe("isManagerRole", () => {
  it("owner y admin son managers", () => {
    expect(isManagerRole("owner")).toBe(true);
    expect(isManagerRole("admin")).toBe(true);
  });

  it("editor no es manager", () => {
    expect(isManagerRole("editor")).toBe(false);
  });

  it("rol desconocido o no-miembro (null) no es manager", () => {
    expect(isManagerRole("viewer")).toBe(false);
    expect(isManagerRole(null)).toBe(false);
  });
});

describe("isOwnerRole", () => {
  it("solo el owner (la acción más destructiva: eliminar álbum)", () => {
    expect(isOwnerRole("owner")).toBe(true);
    expect(isOwnerRole("admin")).toBe(false);
    expect(isOwnerRole("editor")).toBe(false);
    expect(isOwnerRole(null)).toBe(false);
  });
});

describe("isEditorRole", () => {
  it("owner, admin y editor pueden marcar figuritas", () => {
    expect(isEditorRole("owner")).toBe(true);
    expect(isEditorRole("admin")).toBe(true);
    expect(isEditorRole("editor")).toBe(true);
  });

  it("rol desconocido o no-miembro (null) no puede", () => {
    expect(isEditorRole("viewer")).toBe(false);
    expect(isEditorRole(null)).toBe(false);
  });
});
