import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

interface HeroSeed {
  id: number;
  name: string;
  primaryRole: string;
  secondaryRole: string | null;
  primaryLane: string;
  secondaryLane: string | null;
  releaseDate: string | null;
  releaseYear: number;
  priceBP: number | null;
  priceDiamond: number | null;
  note: string | null;
}

interface SkinSeed {
  id: number;
  name: string;
  heroId: number;
  hero: string;
  rarity: string;
  series: string | null;
  releaseDate: string | null;
  releaseYear: number;
  priceDiamond: number | null;
  acquisition: string | null;
}

const initialPlayers = [
  { nickname: "ArekITS" }, // id 1
  { nickname: "RoamersSenja" }, // id 2
  { nickname: "MageSurabaya" }, // id 3
];

// Reset sequence Postgres agar id berikutnya melanjutkan data seed
// (wajib: testcase 06 mengharapkan hero baru ber-id 134, testcase 12 player baru ber-id 4).
async function resetSequence(table: string): Promise<void> {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), (SELECT COALESCE(MAX("id"), 1) FROM "${table}"))`,
  );
}

async function main(): Promise<void> {
  const heroesPath = path.join(__dirname, "..", "data", "heroes.json");
  const skinsPath = path.join(__dirname, "..", "data", "skins.json");

  const heroes: HeroSeed[] = JSON.parse(fs.readFileSync(heroesPath, "utf-8"));
  const skins: SkinSeed[] = JSON.parse(fs.readFileSync(skinsPath, "utf-8"));

  console.log("🧹 Membersihkan data lama (idempotent)...");
  await prisma.playerHero.deleteMany();
  await prisma.skin.deleteMany();
  await prisma.hero.deleteMany();
  await prisma.player.deleteMany();

  console.log(`⬇️  Menanam ${heroes.length} hero...`);
  await prisma.hero.createMany({
    data: heroes.map((h) => ({
      id: h.id,
      name: h.name,
      role: h.primaryRole as never,
      lane: h.primaryLane as never,
      secondaryRole: (h.secondaryRole ?? null) as never,
      secondaryLane: (h.secondaryLane ?? null) as never,
      releaseDate: h.releaseDate,
      releaseYear: h.releaseYear,
      priceBP: h.priceBP,
      priceDiamond: h.priceDiamond,
      note: h.note,
    })),
  });

  console.log(`⬇️  Menanam ${skins.length} skin...`);
  await prisma.skin.createMany({
    data: skins.map((s) => ({
      id: s.id,
      name: s.name,
      heroId: s.heroId,
      rarity: s.rarity as never,
      series: s.series,
      releaseDate: s.releaseDate,
      releaseYear: s.releaseYear,
      priceDiamond: s.priceDiamond,
      acquisition: s.acquisition,
    })),
  });

  console.log(`⬇️  Menanam ${initialPlayers.length} player awal (10.000 BP, 0 Diamond)...`);
  await prisma.player.createMany({ data: initialPlayers });

  console.log("🔁 Menyetel ulang sequence id...");
  await resetSequence("Hero");
  await resetSequence("Skin");
  await resetSequence("Player");

  const totalHeroes = await prisma.hero.count();
  const totalSkins = await prisma.skin.count();
  const totalPlayers = await prisma.player.count();

  console.log("✅ Seeder selesai!");
  console.log(`   Hero   : ${totalHeroes} (harus 133)`);
  console.log(`   Skin   : ${totalSkins} (harus 892)`);
  console.log(`   Player : ${totalPlayers} (harus 3)`);
}

main()
  .catch((error) => {
    console.error("❌ Seeder gagal:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
