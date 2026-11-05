import type { Request, Response } from "express";
import { Rarity } from "../generated/prisma";
import { prisma } from "../config/db";
import { HttpError } from "../utils/http-error";
import { success } from "../utils/response";
import { parseId, parsePagination } from "../utils/parse";

const VALID_RARITIES = Object.values(Rarity) as string[];

const heroBrief = { select: { id: true, name: true, role: true } };

export async function getSkins(req: Request, res: Response): Promise<void> {
  const { page, limit, skip, take } = parsePagination(req.query);
  const { heroId, rarity } = req.query as { heroId?: string; rarity?: string };

  const where: { heroId?: number; rarity?: Rarity } = {};

  if (heroId !== undefined && heroId !== "") {
    const parsedHeroId = Number(heroId);
    if (!Number.isInteger(parsedHeroId) || parsedHeroId <= 0) {
      throw new HttpError(400, "Query heroId harus berupa angka yang valid");
    }
    where.heroId = parsedHeroId;
  }

  if (rarity !== undefined && rarity !== "") {
    if (!VALID_RARITIES.includes(rarity)) {
      throw new HttpError(400, `Rarity tidak valid. Pilihan: ${VALID_RARITIES.join(", ")}`);
    }
    where.rarity = rarity as Rarity;
  }

  const [skins, totalItems] = await prisma.$transaction([
    prisma.skin.findMany({ where, skip, take, orderBy: { id: "asc" }, include: { hero: heroBrief } }),
    prisma.skin.count({ where }),
  ]);

  success(res, {
    message: "Berhasil mengambil data skin",
    data: skins,
    metadata: { currentPage: page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
  });
}

export async function getSkinById(req: Request, res: Response): Promise<void> {
  const skinId = parseId(req.params.skin_id as string);
  if (skinId === null) {
    throw new HttpError(400, "Parameter skin_id harus berupa angka yang valid");
  }

  const skin = await prisma.skin.findUnique({
    where: { id: skinId },
    include: { hero: heroBrief },
  });

  if (!skin) {
    throw new HttpError(404, `Skin dengan id ${skinId} tidak ditemukan`);
  }

  success(res, { message: "Berhasil mengambil detail skin", data: skin });
}
