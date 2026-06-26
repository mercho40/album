import { describe, it, expect } from "bun:test";
import { normalize, stickerMatchesQuery } from "./search";

const messi = { playerName: "Lionel Messi", team: "Argentina" };
const mbappe = { playerName: "Kylian Mbappé", team: "Francia" };

describe("normalize", () => {
	it("saca acentos y pasa a minúsculas", () => {
		expect(normalize("Mbappé")).toBe("mbappe");
		expect(normalize("MÉXICO")).toBe("mexico");
	});
});

describe("stickerMatchesQuery", () => {
	it("query vacía o en blanco matchea todo", () => {
		expect(stickerMatchesQuery(messi, "")).toBe(true);
		expect(stickerMatchesQuery(messi, "   ")).toBe(true);
	});

	it("matchea por nombre de jugador (case-insensitive)", () => {
		expect(stickerMatchesQuery(messi, "messi")).toBe(true);
		expect(stickerMatchesQuery(messi, "LIONEL")).toBe(true);
	});

	it("matchea por nombre de equipo", () => {
		expect(stickerMatchesQuery(messi, "argent")).toBe(true);
	});

	it("matchea por código FIFA del país", () => {
		expect(stickerMatchesQuery(messi, "ARG")).toBe(true);
		expect(stickerMatchesQuery(mbappe, "fra")).toBe(true);
	});

	it("matchea sin importar acentos en la query", () => {
		expect(stickerMatchesQuery(mbappe, "mbappe")).toBe(true);
	});

	it("devuelve false cuando no hay ninguna coincidencia", () => {
		expect(stickerMatchesQuery(messi, "brasil")).toBe(false);
	});
});
