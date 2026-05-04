#!/usr/bin/env bun
/**
 * Script para generar el catálogo completo de stickers del Mundial 2026 de Panini.
 * Fuente principal: https://www.checklistinsider.com/2026-panini-fifa-world-cup-sticker
 *
 * Uso:
 *   bun run apps/back/scripts/scrape-wc2026.ts > apps/back/seed/wc2026.json
 *
 * O desde apps/back/:
 *   bun run scripts/scrape-wc2026.ts > seed/wc2026.json
 */

import { writeFileSync } from "fs";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

type StickerType =
  | "cover"
  | "intro"
  | "history"
  | "team_photo"
  | "badge"
  | "player"
  | "promo";

interface Sticker {
  id: string;
  catalogId: string;
  number: string;
  playerName: string;
  team: string;
  type: StickerType;
  imageUrl: null;
}

// ------------------------------------------------------------------
// Team name translations (English from source → Spanish for display)
// ------------------------------------------------------------------

const TEAM_NAMES_ES: Record<string, string> = {
  Algeria: "Argelia",
  Argentina: "Argentina",
  Australia: "Australia",
  Austria: "Austria",
  Belgium: "Bélgica",
  "Bosnia and Herzegovina": "Bosnia y Herzegovina",
  Brazil: "Brasil",
  Canada: "Canadá",
  "Cape Verde": "Cabo Verde",
  Colombia: "Colombia",
  "Congo DR": "Congo DR",
  "Ivory Coast": "Costa de Marfil",
  Croatia: "Croacia",
  "Curaçao": "Curaçao",
  Czechia: "Chequia",
  Ecuador: "Ecuador",
  Egypt: "Egipto",
  England: "Inglaterra",
  France: "Francia",
  Germany: "Alemania",
  Ghana: "Ghana",
  Haiti: "Haití",
  Iran: "Irán",
  Iraq: "Irak",
  Jordan: "Jordania",
  Japan: "Japón",
  "South Korea": "Corea del Sur",
  "Saudi Arabia": "Arabia Saudita",
  Morocco: "Marruecos",
  Mexico: "México",
  Netherlands: "Países Bajos",
  Norway: "Noruega",
  "New Zealand": "Nueva Zelanda",
  Panama: "Panamá",
  Paraguay: "Paraguay",
  Portugal: "Portugal",
  Qatar: "Catar",
  "South Africa": "Sudáfrica",
  Scotland: "Escocia",
  Senegal: "Senegal",
  Switzerland: "Suiza",
  Sweden: "Suecia",
  Tunisia: "Túnez",
  "Türkiye": "Turquía",
  Uruguay: "Uruguay",
  USA: "Estados Unidos",
  Uzbekistan: "Uzbekistán",
  Spain: "España",
};

// Known code fixes (typos in source data)
const CODE_FIXES: Record<string, string> = {
  SWI9: "SUI9",
  SWI20: "SUI20",
  KAS12: "KSA12",
};

// ------------------------------------------------------------------
// Main scraper
// ------------------------------------------------------------------

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").trim();
}

function parseBaseStickers(html: string): Array<{ code: string; rawName: string }> {
  // Find article element
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/);
  if (!articleMatch) throw new Error("Could not find <article> in page");
  const article = articleMatch[1];

  // Locate the base sticker block: from "00 Panini Logo FOIL" to "Insert Checklist"
  const baseStart = article.indexOf("00 Panini Logo FOIL");
  const insertStart = article.indexOf("Insert Checklist");
  if (baseStart === -1) throw new Error("Could not find start of base sticker list");
  if (insertStart === -1) throw new Error("Could not find 'Insert Checklist' marker");

  const block = article.slice(baseStart, insertStart);

  // Each sticker is: CODE NAME<br />\n
  const lines = block.split(/<br\s*\/>\s*\n/);
  const stickers: Array<{ code: string; rawName: string }> = [];

  for (const line of lines) {
    const clean = stripTags(line).replace(/\s+/g, " ").trim();
    if (!clean) continue;

    // Match: CODE NAME  (CODE = 00 | FWC\d+ | [A-Z]{2,3}\d+)
    const m = clean.match(/^(00|FWC\d+|[A-Z]{2,3}\d+)\s+(.+)$/);
    if (!m) continue;

    let code = m[1];
    const rawName = m[2].trim();

    // Apply known fixes
    code = CODE_FIXES[code] ?? code;
    stickers.push({ code, rawName });
  }

  return stickers;
}

function parseCocaColaStickers(html: string): Array<{ number: number; name: string }> {
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/);
  if (!articleMatch) throw new Error("Could not find <article> in page");
  const article = articleMatch[1];

  const ccStart = article.indexOf("Coca-Cola USA Checklist");
  if (ccStart === -1) throw new Error("Could not find Coca-Cola section");

  const ccSection = article.slice(ccStart, ccStart + 3000);
  const clean = stripTags(ccSection).replace(/\s+/g, " ");

  // Match "1 Lamine Yamal - Spain" etc.
  const matches = [...clean.matchAll(/\b(\d{1,2})\s+([A-ZÁÉÍÓÚÑÜÀÂÇÈÊÎÔÙÛÄËÏÖÜ][^0-9\n]+?)\s*(?=\d{1,2}\s+[A-Z]|$)/g)];
  const result: Array<{ number: number; name: string }> = [];

  // Simpler approach: split the text block that contains the stickers
  const blockMatch = clean.match(/Exclusive to marked Coca-Cola labels\.(.+?)(\$|\d{1,3}\.\d{2}|Buy on)/s);
  if (blockMatch) {
    const block = blockMatch[1].trim();
    const lineMatches = [...block.matchAll(/(\d{1,2})\s+(.+?)(?=\s+\d{1,2}\s+[A-Z]|$)/g)];
    for (const lm of lineMatches) {
      const num = parseInt(lm[1]);
      const name = lm[2].trim();
      if (num >= 1 && num <= 12 && name.length > 2) {
        result.push({ number: num, name });
      }
    }
  }

  return result;
}

// ------------------------------------------------------------------
// Convert raw sticker data to final Sticker shape
// ------------------------------------------------------------------

function buildStickers(
  base: Array<{ code: string; rawName: string }>,
  cocaCola: Array<{ number: number; name: string }>
): Sticker[] {
  const result: Sticker[] = [];

  // Build code → country mapping from team logo stickers
  const codeToCountryEn: Record<string, string> = {};
  for (const { code, rawName } of base) {
    const m = code.match(/^([A-Z]{2,3})1$/);
    if (m) {
      const teamCode = m[1];
      const cm = rawName.match(/^Team Logo - (.+?) FOIL$/);
      if (cm) {
        codeToCountryEn[teamCode] = cm[1];
      }
    }
  }

  // Process each base sticker
  for (const { code, rawName } of base) {
    // Determine sticker type and details
    if (code === "00") {
      result.push({
        id: "WC2026-00",
        catalogId: "WC2026",
        number: "00",
        playerName: "Logo Panini",
        team: "Cover",
        type: "cover",
        imageUrl: null,
      });
      continue;
    }

    if (code.match(/^FWC[1-8]$/)) {
      // FWC1–FWC8: intro stickers
      const introNames: Record<string, string> = {
        FWC1: "Emblema Oficial",
        FWC2: "Emblema Oficial",
        FWC3: "Mascotas Oficiales",
        FWC4: "Lema Oficial",
        FWC5: "Balón Oficial",
        FWC6: "Países y Ciudades Sede – Canadá",
        FWC7: "Países y Ciudades Sede – México",
        FWC8: "Países y Ciudades Sede – EE. UU.",
      };
      result.push({
        id: `WC2026-${code}`,
        catalogId: "WC2026",
        number: code,
        playerName: introNames[code] ?? rawName.replace(" FOIL", "").trim(),
        team: "Intro",
        type: "intro",
        imageUrl: null,
      });
      continue;
    }

    if (code.match(/^FWC(9|1[0-9])$/)) {
      // FWC9–FWC19: history stickers
      // rawName like "Italy 1934 - FIFA Museum FOIL" (may have trailing HTML noise)
      const histName = rawName
        .replace(/ - FIFA Museum FOIL.*$/, "")
        .trim();
      result.push({
        id: `WC2026-${code}`,
        catalogId: "WC2026",
        number: code,
        playerName: histName,
        team: "History",
        type: "history",
        imageUrl: null,
      });
      continue;
    }

    // Team sticker
    const teamMatch = code.match(/^([A-Z]{2,3})(\d+)$/);
    if (!teamMatch) {
      console.error(`WARNING: Unrecognized code format: ${code}`);
      continue;
    }

    const teamCode = teamMatch[1];
    const stickerNum = parseInt(teamMatch[2]);
    const countryEn = codeToCountryEn[teamCode];

    if (!countryEn) {
      console.error(`WARNING: No country mapping for team code: ${teamCode}`);
      continue;
    }

    const countryEs = TEAM_NAMES_ES[countryEn] ?? countryEn;

    if (stickerNum === 1) {
      // Badge / team logo (FOIL)
      result.push({
        id: `WC2026-${code}`,
        catalogId: "WC2026",
        number: code,
        playerName: `${countryEs} – Escudo`,
        team: countryEs,
        type: "badge",
        imageUrl: null,
      });
    } else if (stickerNum === 13) {
      // Team photo
      result.push({
        id: `WC2026-${code}`,
        catalogId: "WC2026",
        number: code,
        playerName: `${countryEs} – Equipo`,
        team: countryEs,
        type: "team_photo",
        imageUrl: null,
      });
    } else {
      // Player sticker
      // rawName like "Lionel Messi - Argentina" → extract player name
      let playerName = rawName;
      const dashIdx = rawName.lastIndexOf(" - ");
      if (dashIdx !== -1) {
        playerName = rawName.slice(0, dashIdx).trim();
      }
      result.push({
        id: `WC2026-${code}`,
        catalogId: "WC2026",
        number: code,
        playerName,
        team: countryEs,
        type: "player",
        imageUrl: null,
      });
    }
  }

  // Process Coca-Cola stickers
  for (const { number, name } of cocaCola) {
    // name like "Lamine Yamal - Spain"
    let playerName = name;
    const dashIdx = name.lastIndexOf(" - ");
    if (dashIdx !== -1) {
      playerName = name.slice(0, dashIdx).trim();
    }
    result.push({
      id: `WC2026-CC${number}`,
      catalogId: "WC2026",
      number: `CC${number}`,
      playerName: playerName || `Coca-Cola Sticker ${number}`,
      team: "Coca-Cola Promo",
      type: "promo",
      imageUrl: null,
    });
  }

  return result;
}

// ------------------------------------------------------------------
// Validation
// ------------------------------------------------------------------

function validate(stickers: Sticker[]): void {
  const ids = new Set(stickers.map((s) => s.id));
  if (ids.size !== stickers.length) {
    console.error(`ERROR: Duplicate IDs detected! ${stickers.length - ids.size} duplicates`);
    const seen = new Set<string>();
    for (const s of stickers) {
      if (seen.has(s.id)) console.error(`  Duplicate: ${s.id}`);
      seen.add(s.id);
    }
  }

  const empties = stickers.filter((s) => !s.playerName);
  if (empties.length > 0) {
    console.error(`ERROR: ${empties.length} stickers with empty playerName:`);
    for (const s of empties) console.error(`  ${s.id}`);
  }

  const teamStickers = stickers.filter((s) =>
    ["player", "team_photo", "badge"].includes(s.type)
  );
  const teams = new Set(teamStickers.map((s) => s.team));

  // Check each team has exactly 20 stickers
  for (const team of teams) {
    const count = teamStickers.filter((s) => s.team === team).length;
    if (count !== 20) {
      console.error(`ERROR: Team "${team}" has ${count} stickers (expected 20)`);
    }
  }

  console.error(`--- Validation ---`);
  console.error(`Total: ${stickers.length}`);
  console.error(`Unique IDs: ${ids.size}`);
  console.error(`Teams: ${teams.size}`);
  console.error(`Empties: ${empties.length}`);
  console.error(`Types: ${[...new Set(stickers.map((s) => s.type))].join(", ")}`);
}

// ------------------------------------------------------------------
// Entry point
// ------------------------------------------------------------------

async function main() {
  const PRIMARY_URL =
    "https://www.checklistinsider.com/2026-panini-fifa-world-cup-sticker";

  console.error("Fetching primary source...");
  const html = await fetchPage(PRIMARY_URL);

  console.error("Parsing base stickers...");
  const baseRaw = parseBaseStickers(html);
  console.error(`  Found ${baseRaw.length} base stickers`);

  console.error("Parsing Coca-Cola stickers...");
  const ccRaw = parseCocaColaStickers(html);
  console.error(`  Found ${ccRaw.length} Coca-Cola stickers`);

  console.error("Building sticker objects...");
  const stickers = buildStickers(baseRaw, ccRaw);

  validate(stickers);

  // Output JSON to stdout
  process.stdout.write(JSON.stringify(stickers, null, 2) + "\n");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
