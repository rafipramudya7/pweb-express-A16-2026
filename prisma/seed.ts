import "dotenv/config";
import fs from "fs";
import path from "path";
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

// Data 3 Player awal sesuai tabel penugasan
const initialPlayers = [
  { id: 1, nickname: "ArekITS", bp: 1500, diamond: 75 },
  { id: 2, nickname: "SangPushRank", bp: 13000, diamond: 2892 },
  { id: 3, nickname: "MageSurabaya", bp: 10000, diamond: 0 },
];

// Data 4 PlayerHero awal sesuai tabel penugasan
const initialPlayerHeroes = [
  { playerId: 1, heroId: 18, currency: "BP" as never, pricePaid: 2000 },
  { playerId: 1, heroId: 1, currency: "BP" as never, pricePaid: 10800 },
  { playerId: 2, heroId: 84, currency: "DIAMOND" as never, pricePaid: 599 },
  { playerId: 2, heroId: 56, currency: "BP" as never, pricePaid: 32000 },
];

// Reset sequence Postgres agar ID autoincrement berjalan normal
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

  console.log(`⬇️  Menanam ${initialPlayers.length} player awal...`);
  await prisma.player.createMany({ data: initialPlayers });

  console.log(`⬇️  Menanam ${initialPlayerHeroes.length} player hero awal...`);
  await prisma.playerHero.createMany({ data: initialPlayerHeroes });

  console.log("🔁 Menyetel ulang sequence id...");
  await resetSequence("Hero");
  await resetSequence("Skin");
  await resetSequence("Player");
  await resetSequence("PlayerHero");

  const totalHeroes = await prisma.hero.count();
  const totalSkins = await prisma.skin.count();
  const totalPlayers = await prisma.player.count();
  const totalPlayerHeroes = await prisma.playerHero.count();

  console.log("✅ Seeder selesai!");
  console.log(`   Hero        : ${totalHeroes} (harus 133)`);
  console.log(`   Skin        : ${totalSkins} (harus 892)`);
  console.log(`   Player      : ${totalPlayers} (harus 3)`);
  console.log(`   PlayerHero  : ${totalPlayerHeroes} (harus 4)`);
}

main()
  .catch((error) => {
    console.error("❌ Seeder gagal:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });