import type { Request, Response } from "express";
import { prisma } from "../config/db";
import { HttpError } from "../utils/http-error";
import { parseId } from "../utils/parse";
import { success } from "../utils/response";

// 0. GET /api/players (Mengambil Semua Player untuk Dropdown Frontend Web)
export const getAllPlayers = async (_req: Request, res: Response) => {
  const players = await prisma.player.findMany({
    orderBy: { id: "asc" },
  });

  success(res, {
    message: "Berhasil mengambil data players",
    data: players,
  });
};

// 1. POST /api/players (Buat Player Baru)
export const createPlayer = async (req: Request, res: Response) => {
  const { nickname } = req.body ?? {};

  if (!nickname || typeof nickname !== "string" || nickname.trim() === "") {
    throw new HttpError(400, "Nickname wajib diisi");
  }

  const existingPlayer = await prisma.player.findUnique({
    where: { nickname: nickname.trim() },
  });

  if (existingPlayer) {
    throw new HttpError(409, "Nickname sudah terdaftar");
  }

  const player = await prisma.player.create({
    data: { nickname: nickname.trim() },
  });

  success(res, {
    status: 201,
    message: "Player berhasil dibuat",
    data: player,
  });
};

// 2. GET /api/players/:player_id (Detail Player & Daftar Hero Miliknya)
export const getPlayerById = async (req: Request, res: Response) => {
  const playerId = parseId(req.params.player_id as string);
  if (playerId === null) {
    throw new HttpError(400, "ID player tidak valid");
  }

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      heroes: {
        include: {
          hero: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  const formattedHeroes = player.heroes.map((ph) => ({
    heroId: ph.heroId,
    name: ph.hero.name,
    currency: ph.currency,
    pricePaid: ph.pricePaid,
  }));

  const responseData = {
    id: player.id,
    nickname: player.nickname,
    bp: player.bp,
    diamond: player.diamond,
    createdAt: player.createdAt,
    heroes: formattedHeroes,
  };

  success(res, {
    message: "Berhasil mengambil data player",
    data: responseData,
  });
};

// 3. PATCH /api/players/:player_id (Update Nickname Player)
export const updatePlayer = async (req: Request, res: Response) => {
  const playerId = parseId(req.params.player_id as string);
  if (playerId === null) {
    throw new HttpError(400, "ID player tidak valid");
  }

  const { nickname } = req.body ?? {};

  if (!nickname || typeof nickname !== "string" || nickname.trim() === "") {
    throw new HttpError(400, "Nickname wajib diisi");
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  const existingNickname = await prisma.player.findUnique({
    where: { nickname: nickname.trim() },
  });

  if (existingNickname && existingNickname.id !== playerId) {
    throw new HttpError(409, "Nickname sudah dipakai player lain");
  }

  const updatedPlayer = await prisma.player.update({
    where: { id: playerId },
    data: { nickname: nickname.trim() },
  });

  success(res, {
    message: "Player berhasil diupdate",
    data: updatedPlayer,
  });
};

// 4. DELETE /api/players/:player_id (Hapus Player)
export const deletePlayer = async (req: Request, res: Response) => {
  const playerId = parseId(req.params.player_id as string);
  if (playerId === null) {
    throw new HttpError(400, "ID player tidak valid");
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  await prisma.player.delete({ where: { id: playerId } });

  success(res, {
    message: "Player berhasil dihapus",
  });
};

// 5. POST /api/players/:player_id/topup (Top Up Diamond)
export const topUpDiamond = async (req: Request, res: Response) => {
  const playerId = parseId(req.params.player_id as string);
  if (playerId === null) {
    throw new HttpError(400, "ID player tidak valid");
  }

  const { amount } = req.body ?? {};

  if (!amount || typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
    throw new HttpError(400, "Amount harus berupa bilangan bulat lebih dari 0");
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  const updatedPlayer = await prisma.player.update({
    where: { id: playerId },
    data: {
      diamond: { increment: amount },
    },
  });

  success(res, {
    message: "Top up berhasil",
    data: {
      playerId: updatedPlayer.id,
      amount,
      diamond: updatedPlayer.diamond,
    },
  });
};

// 6. POST /api/players/:player_id/matches (Hadiah Match BP)
export const addMatchResult = async (req: Request, res: Response) => {
  const playerId = parseId(req.params.player_id as string);
  if (playerId === null) {
    throw new HttpError(400, "ID player tidak valid");
  }

  const { result } = req.body ?? {};

  if (result !== "WIN" && result !== "LOSE") {
    throw new HttpError(400, "Result harus WIN atau LOSE");
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  const bpEarned = result === "WIN" ? 300 : 100;

  const updatedPlayer = await prisma.player.update({
    where: { id: playerId },
    data: {
      bp: { increment: bpEarned },
    },
  });

  success(res, {
    message: "Hadiah match berhasil ditambahkan",
    data: {
      playerId: updatedPlayer.id,
      result,
      bpEarned,
      bp: updatedPlayer.bp,
    },
  });
};