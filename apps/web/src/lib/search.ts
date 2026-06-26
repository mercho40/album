// Matching de la barra de búsqueda de figuritas.
//
// Funciones puras (extraídas de sticker-grid.svelte) para testearlas aisladas.
// Una figurita matchea una query si coincide por nombre de jugador, nombre de
// equipo o código FIFA del país (e.g. "ARG" → Argentina), todo sin distinguir
// mayúsculas ni acentos.

import { COUNTRY_CODES } from "./data/country-codes";

export interface SearchableSticker {
	playerName: string;
	team: string;
}

/** Pasa a minúsculas y saca los acentos (marcas diacríticas combinantes). */
export function normalize(s: string): string {
	return s
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase();
}

export function stickerMatchesQuery(sticker: SearchableSticker, query: string): boolean {
	const q = normalize(query.trim());
	if (!q) return true;

	const code = (COUNTRY_CODES[sticker.team] ?? "").toLowerCase();
	return (
		normalize(sticker.playerName).includes(q) ||
		normalize(sticker.team).includes(q) ||
		code.includes(q)
	);
}
