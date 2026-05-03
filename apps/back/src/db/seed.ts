import { db } from "./drizzle";
import { sticker } from "./schema";
import seedData from "../../seed/wc2026.json";

type SeedSticker = {
  id: string;
  catalogId: string;
  number: string;
  playerName: string;
  team: string;
  type: string;
  imageUrl: string | null;
};

async function main() {
  const data = seedData as SeedSticker[];
  console.log(`Seeding ${data.length} stickers...`);

  for (const s of data) {
    await db
      .insert(sticker)
      .values(s)
      .onConflictDoUpdate({
        target: sticker.id,
        set: {
          playerName: s.playerName,
          team: s.team,
          type: s.type,
          imageUrl: s.imageUrl,
        },
      });
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
