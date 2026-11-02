-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ASSASSIN', 'FIGHTER', 'MAGE', 'MARKSMAN', 'SUPPORT', 'TANK');

-- CreateEnum
CREATE TYPE "Lane" AS ENUM ('EXP', 'GOLD', 'JUNGLE', 'MID', 'ROAM');

-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('COMMON', 'DELUXE', 'EXCEPTIONAL', 'EXQUISITE', 'GRAND', 'SUPREME');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('BP', 'DIAMOND');

-- CreateTable
CREATE TABLE "Hero" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "lane" "Lane" NOT NULL,
    "secondaryRole" "Role",
    "secondaryLane" "Lane",
    "releaseDate" TEXT,
    "releaseYear" INTEGER NOT NULL,
    "priceBP" INTEGER,
    "priceDiamond" INTEGER,
    "note" TEXT,

    CONSTRAINT "Hero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skin" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "heroId" INTEGER NOT NULL,
    "rarity" "Rarity" NOT NULL,
    "series" TEXT,
    "releaseDate" TEXT,
    "releaseYear" INTEGER NOT NULL,
    "priceDiamond" INTEGER,
    "acquisition" TEXT,

    CONSTRAINT "Skin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "nickname" TEXT NOT NULL,
    "bp" INTEGER NOT NULL DEFAULT 10000,
    "diamond" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerHero" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "heroId" INTEGER NOT NULL,
    "currency" "Currency" NOT NULL,
    "pricePaid" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerHero_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hero_name_key" ON "Hero"("name");

-- CreateIndex
CREATE INDEX "Skin_heroId_idx" ON "Skin"("heroId");

-- CreateIndex
CREATE INDEX "Skin_rarity_idx" ON "Skin"("rarity");

-- CreateIndex
CREATE UNIQUE INDEX "Player_nickname_key" ON "Player"("nickname");

-- CreateIndex
CREATE INDEX "PlayerHero_playerId_idx" ON "PlayerHero"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerHero_playerId_heroId_key" ON "PlayerHero"("playerId", "heroId");

-- AddForeignKey
ALTER TABLE "Skin" ADD CONSTRAINT "Skin_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "Hero"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerHero" ADD CONSTRAINT "PlayerHero_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerHero" ADD CONSTRAINT "PlayerHero_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "Hero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
