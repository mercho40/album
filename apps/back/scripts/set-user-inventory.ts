/**
 * Sets the inventory of a user's first album: count=1 for stickers they own,
 * count=0 for the ones in the `needed` list.
 *
 * Usage:
 *   USER_EMAIL=simon@mersich.net DATABASE_URL=postgresql://... \
 *     bun run apps/back/scripts/set-user-inventory.ts
 */
import { eq, and } from "drizzle-orm";
import { db } from "../src/db/drizzle";
import { user, member, organization, album, sticker, albumSticker } from "../src/db/schema";

// Lista de figuritas que el user TODAVÍA NECESITA (no las tiene). El resto las tiene (count=1).
const needed = {
	cover: ["00"], // sticker 00 (cover)
	fwc: [1, 2, 4, 5, 6, 9, 10, 12, 13, 14, 15, 16, 17, 19], // FWC1..FWC19 que faltan
	teams: {
		MEX: [1, 2, 6, 7, 9, 10, 11, 13, 16, 17, 19],
		RSA: [2, 4, 8, 9, 10, 13, 19],
		KOR: [1, 6, 7, 10, 11, 12, 13, 15, 16, 17, 19, 20],
		CZE: [1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15, 16, 18, 19, 20],
		CAN: [3, 6, 7, 9, 13, 15, 16, 19, 20],
		BIH: [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 18, 19, 20],
		QAT: [2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
		SUI: [4, 9, 13, 14, 16, 17],
		BRA: [3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 20],
		MAR: [1, 3, 4, 5, 7, 8, 9, 11, 12, 14, 16, 17, 18, 19, 20],
		HAI: [1, 3, 4, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19],
		SCO: [4, 5, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18],
		USA: [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 14, 15, 16, 18, 19, 20],
		PAR: [4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20],
		AUS: [1, 2, 3, 4, 6, 7, 10, 13, 14, 15, 16, 17, 18, 19, 20],
		TUR: [1, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 20],
		GER: [1, 2, 4, 5, 7, 8, 9, 11, 12, 13, 14, 16, 17, 20],
		CUW: [1, 2, 3, 4, 5, 7, 8, 9, 10, 12, 13, 15, 17, 18, 20],
		CIV: [1, 3, 4, 5, 8, 9, 11, 12, 14, 15, 16, 18, 20],
		ECU: [1, 3, 6, 7, 8, 11, 12, 13, 14, 15, 18, 19, 20],
		NED: [4, 6, 7, 9, 11, 13, 14, 15, 16, 17, 19, 20],
		JPN: [1, 5, 6, 8, 9, 10, 12, 13, 14, 15, 17, 18, 19],
		SWE: [1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15, 16, 18, 19, 20],
		TUN: [1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 16, 18, 19, 20],
		BEL: [2, 3, 5, 6, 7, 8, 9, 10, 11, 14, 15, 18, 19],
		EGY: [1, 2, 3, 4, 5, 8, 9, 11, 12, 14, 15, 16, 17, 19, 20],
		IRN: [1, 3, 4, 6, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20],
		NZL: [2, 3, 4, 6, 7, 8, 10, 12, 13, 16, 17, 19, 20],
		ESP: [1, 2, 3, 4, 8, 9, 10, 11, 12, 14, 15, 16, 17, 19, 20],
		CPV: [1, 7, 8, 12, 13, 16, 17, 18, 19, 20],
		KSA: [2, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 18, 19, 20],
		URU: [1, 2, 3, 4, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20],
		FRA: [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20],
		SEN: [2, 3, 5, 6, 7, 10, 11, 13, 18],
		IRQ: [1, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 17, 18, 20],
		NOR: [2, 4, 5, 6, 12, 13, 14, 15, 16, 17, 19],
		ARG: [7, 8, 9, 11, 13, 16, 17, 19, 20],
		ALG: [1, 5, 6, 7, 10, 11, 13, 14, 18, 19, 20],
		AUT: [1, 2, 4, 5, 6, 8, 9, 11, 12, 13, 14, 16, 17, 18],
		JOR: [2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 17, 18, 20],
		POR: [1, 2, 3, 5, 6, 8, 9, 13, 14, 16, 18, 19, 20],
		COD: [3, 4, 5, 6, 7, 8, 9, 11, 12, 14, 16, 17, 18, 20],
		UZB: [1, 3, 4, 5, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 20],
		COL: [1, 2, 3, 6, 7, 9, 10, 12, 15, 16, 17, 19],
		ENG: [2, 3, 5, 6, 7, 8, 10, 11, 13, 14, 15, 18, 19, 20],
		CRO: [1, 2, 6, 7, 10, 13, 14, 15, 16, 18, 19, 20],
		GHA: [1, 2, 4, 5, 6, 7, 9, 10, 11, 15, 16, 17, 18, 19, 20],
		PAN: [1, 2, 3, 4, 5, 6, 7, 9, 11, 14, 16, 18, 20],
	} as Record<string, number[]>,
	cc: [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13],
};

const userEmail = process.env.USER_EMAIL;
if (!userEmail) {
	console.error("Falta USER_EMAIL en el env");
	process.exit(1);
}

const neededIds = new Set<string>();
for (const code of needed.cover) neededIds.add(`WC2026-${code}`);
for (const n of needed.fwc) neededIds.add(`WC2026-FWC${n}`);
for (const [team, nums] of Object.entries(needed.teams)) {
	for (const n of nums) neededIds.add(`WC2026-${team}${n}`);
}
for (const n of needed.cc) neededIds.add(`WC2026-CC${n}`);

console.log(`Faltantes a marcar (count=0): ${neededIds.size}`);

const [u] = await db.select().from(user).where(eq(user.email, userEmail)).limit(1);
if (!u) {
	console.error(`No existe user con email ${userEmail}`);
	process.exit(1);
}
console.log(`User: ${u.id} (${u.email})`);

const memberships = await db
	.select({ orgId: organization.id, slug: organization.slug, name: organization.name })
	.from(member)
	.innerJoin(organization, eq(organization.id, member.organizationId))
	.innerJoin(album, eq(album.organizationId, organization.id))
	.where(eq(member.userId, u.id))
	.orderBy(organization.name);

if (memberships.length === 0) {
	console.error("El user no tiene álbumes");
	process.exit(1);
}

console.log("Álbumes del user:");
memberships.forEach((m, i) => console.log(`  [${i}] ${m.slug} (${m.name})`));

const targetIdx = process.env.ALBUM_INDEX ? Number(process.env.ALBUM_INDEX) : 0;
const target = memberships[targetIdx];
if (!target) {
	console.error(`No hay álbum en índice ${targetIdx}`);
	process.exit(1);
}
console.log(`\nUsando álbum: ${target.slug} (índice ${targetIdx})`);

const stickers = await db
	.select({ id: sticker.id })
	.from(sticker)
	.where(eq(sticker.catalogId, "WC2026"));

console.log(`Catálogo: ${stickers.length} stickers totales`);

let owned = 0;
let missing = 0;
for (const s of stickers) {
	const isNeeded = neededIds.has(s.id);
	const count = isNeeded ? 0 : 1;
	if (isNeeded) missing++;
	else owned++;
	await db
		.insert(albumSticker)
		.values({ albumId: target.orgId, stickerId: s.id, count })
		.onConflictDoUpdate({
			target: [albumSticker.albumId, albumSticker.stickerId],
			set: { count },
		});
}

console.log(`\nDone. Owned: ${owned}, Missing: ${missing}.`);
process.exit(0);
