import type { Request, Response } from "express";
import { Hero, Lane, Prisma, Role } from "../generated/prisma";
import { prisma } from "../config/db";
import { HttpError } from "../utils/http-error";
import { success } from "../utils/response";
import { parseId, parsePagination } from "../utils/parse";

const VALID_ROLES = Object.values(Role) as string[];
const VALID_LANES = Object.values(Lane) as string[];

export async function getHeroes(req: Request, res: Response): Promise<void> {
  const { page, limit, skip, take } = parsePagination(req.query);
  const { search, role } = req.query as { search?: string; role?: string };

  const where: Prisma.HeroWhereInput = {};

  if (search !== undefined && search.trim() !== "") {
    where.name = { contains: search.trim(), mode: "insensitive" };
  }

  if (role !== undefined && role !== "") {
    if (!VALID_ROLES.includes(role)) {
      throw new HttpError(400, `Role tidak valid. Pilihan: ${VALID_ROLES.join(", ")}`);
    }
    where.role = role as Role;
  }

  const [heroes, totalItems] = await prisma.$transaction([
    prisma.hero.findMany({ where, skip, take, orderBy: { id: "asc" } }),
    prisma.hero.count({ where }),
  ]);

  success(res, {
    message: `Berhasil mengambil ${heroes.length} hero`,
    data: heroes,
    metadata: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
  });
}

export async function getHeroById(req: Request, res: Response): Promise<void> {
  const heroId = parseId(req.params.hero_id);
  if (heroId === null) {
    throw new HttpError(400, "Parameter hero_id harus berupa angka yang valid");
  }

  const hero = await prisma.hero.findUnique({
    where: { id: heroId },
    include: { skins: { orderBy: { id: "asc" } } },
  });

  if (!hero) {
    throw new HttpError(404, `Hero dengan id ${heroId} tidak ditemukan`);
  }

  success(res, { message: "Berhasil mengambil detail hero", data: hero });
}
export async function createHero(req: Request, res: Response): Promise<void> {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const { name, role, lane, releaseYear, priceBP, priceDiamond, secondaryRole, secondaryLane, releaseDate, note } = body;

  const problems: string[] = [];

  if (typeof name !== "string" || name.trim() === "") problems.push("name");
  if (role === undefined || role === null || role === "") problems.push("role");
  if (lane === undefined || lane === null || lane === "") problems.push("lane");
  if (releaseYear === undefined || releaseYear === null) problems.push("releaseYear");
  if (priceBP === undefined || priceBP === null) problems.push("priceBP");
  if (priceDiamond === undefined || priceDiamond === null) problems.push("priceDiamond");

  if (problems.length > 0) {
    throw new HttpError(400, `Data tidak lengkap. Field wajib yang kurang: ${problems.join(", ")}`);
  }

  if (!VALID_ROLES.includes(String(role))) {
    throw new HttpError(400, `Role tidak valid. Pilihan: ${VALID_ROLES.join(", ")}`);
  }
  if (!VALID_LANES.includes(String(lane))) {
    throw new HttpError(400, `Lane tidak valid. Pilihan: ${VALID_LANES.join(", ")}`);
  }
  if (secondaryRole !== undefined && secondaryRole !== null && secondaryRole !== "" && !VALID_ROLES.includes(String(secondaryRole))) {
    throw new HttpError(400, `secondaryRole tidak valid. Pilihan: ${VALID_ROLES.join(", ")}`);
  }
  if (secondaryLane !== undefined && secondaryLane !== null && secondaryLane !== "" && !VALID_LANES.includes(String(secondaryLane))) {
    throw new HttpError(400, `secondaryLane tidak valid. Pilihan: ${VALID_LANES.join(", ")}`);
  }
  if (!Number.isInteger(Number(releaseYear)) || Number(releaseYear) <= 0) {
    throw new HttpError(400, "releaseYear harus berupa bilangan bulat positif");
  }
  if (!Number.isInteger(Number(priceBP)) || Number(priceBP) < 0) {
    throw new HttpError(400, "priceBP harus berupa bilangan bulat >= 0");
  }
  if (!Number.isInteger(Number(priceDiamond)) || Number(priceDiamond) < 0) {
    throw new HttpError(400, "priceDiamond harus berupa bilangan bulat >= 0");
  }

  const normalizedName = String(name).trim();

  const duplicate = await prisma.hero.findUnique({ where: { name: normalizedName } });
  if (duplicate) {
    throw new HttpError(409, `Hero dengan nama "${normalizedName}" sudah terdaftar`);
  }

  const hero = await prisma.hero.create({
    data: {
      name: normalizedName,
      role: String(role) as Role,
      lane: String(lane) as Lane,
      secondaryRole:
        secondaryRole !== undefined && secondaryRole !== null && secondaryRole !== ""
          ? (String(secondaryRole) as Role)
          : null,
      secondaryLane:
        secondaryLane !== undefined && secondaryLane !== null && secondaryLane !== ""
          ? (String(secondaryLane) as Lane)
          : null,
      releaseDate: typeof releaseDate === "string" && releaseDate !== "" ? releaseDate : null,
      releaseYear: Number(releaseYear),
      priceBP: Number(priceBP),
      priceDiamond: Number(priceDiamond),
      note: typeof note === "string" && note !== "" ? note : null,
    },
  });

  success(res, { status: 201, message: "Hero berhasil dibuat", data: hero });
}
export type { Hero };
