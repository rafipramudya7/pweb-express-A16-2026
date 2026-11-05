import type { Request, Response } from "express";
import { Currency } from "../generated/prisma";
import { prisma } from "../config/db";
import { HttpError } from "../utils/http-error";
import { parseId } from "../utils/parse";
import { success } from "../utils/response";

const VALID_CURRENCIES = Object.values(Currency) as string[];

// POST /api/players/:player_id/heroes
// Membeli hero memakai BP atau DIAMOND.
// Urutan validasi mengikuti soal penugasan (testcase 17-21):
//   1. heroId / currency tidak valid        -> 400
//   2. player tidak ditemukan               -> 404
//   3. hero tidak ditemukan                 -> 404
//   4. harga hero untuk currency itu null   -> 400
//   5. player sudah memiliki hero           -> 409
//   6. saldo player kurang dari harga       -> 400
export async function buyHero(req: Request, res: Response): Promise<void> {
  const playerId = parseId(req.params.player_id as string);
  if (playerId === null) {
    throw new HttpError(400, "Parameter player_id harus berupa angka yang valid");
  }

  const body = (req.body ?? {}) as Record<string, unknown>;

  // 1a. Validasi heroId
  const heroIdRaw = body.heroId;
  const heroId = Number(heroIdRaw);

  if (
    (typeof heroIdRaw !== "number" && typeof heroIdRaw !== "string") ||
    String(heroIdRaw).trim() === "" ||
    !Number.isInteger(heroId) ||
    heroId <= 0
  ) {
    throw new HttpError(400, "heroId wajib diisi dan berupa bilangan bulat positif");
  }

  // 1b. Validasi currency
  const currency = body.currency;
  if (typeof currency !== "string" || !VALID_CURRENCIES.includes(currency)) {
    throw new HttpError(400, "currency harus BP atau DIAMOND");
  }

  // 2. Player harus ada
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  // 3. Hero harus ada
  const hero = await prisma.hero.findUnique({ where: { id: heroId } });
  if (!hero) {
    throw new HttpError(404, "Hero tidak ditemukan");
  }

  // 4. Hero harus punya harga untuk mata uang yang dipilih
  const price = currency === Currency.BP ? hero.priceBP : hero.priceDiamond;
  if (price === null) {
    throw new HttpError(400, `Hero ${hero.name} tidak bisa dibeli dengan ${currency}`);
  }

  // 5. Player tidak boleh membeli hero yang sama dua kali
  const existingPurchase = await prisma.playerHero.findUnique({
    where: { playerId_heroId: { playerId, heroId } },
  });
  if (existingPurchase) {
    throw new HttpError(409, "Player sudah memiliki hero ini");
  }

  // 6. Saldo harus mencukupi
  const balance = currency === Currency.BP ? player.bp : player.diamond;
  if (balance < price) {
    throw new HttpError(400, `Saldo ${currency} tidak mencukupi`);
  }

  // Transaksi atomik sesuai soal: potong saldo + catat kepemilikan hero.
  // Kalau salah satu gagal, keduanya dibatalkan (rollback).
  const [updatedPlayer, purchase] = await prisma.$transaction([
    prisma.player.update({
      where: { id: playerId },
      data:
        currency === Currency.BP
          ? { bp: { decrement: price } }
          : { diamond: { decrement: price } },
    }),
    prisma.playerHero.create({
      data: {
        playerId,
        heroId,
        currency: currency as Currency,
        pricePaid: price,
      },
    }),
  ]);

  success(res, {
    status: 201,
    message: "Hero berhasil dibeli",
    data: {
      hero: {
        id: hero.id,
        name: hero.name,
      },
      currency,
      pricePaid: purchase.pricePaid,
      balance: {
        bp: updatedPlayer.bp,
        diamond: updatedPlayer.diamond,
      },
    },
  });
}
