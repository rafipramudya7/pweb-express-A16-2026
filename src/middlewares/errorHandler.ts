import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../generated/prisma";
import { HttpError } from "../utils/http-error";

// Middleware penanganan error terpusat.
// Urutan pengecekan: HttpError -> error Prisma yang dikenal -> 500 generik.
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      data: null,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        status: "error",
        message: "Data sudah ada (melanggar constraint unik)",
        data: null,
      });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({
        status: "error",
        message: "Data tidak ditemukan",
        data: null,
      });
      return;
    }
  }

  console.error("[errorHandler]", err);
  res.status(500).json({
    status: "error",
    message: "Terjadi kesalahan internal pada server",
    data: null,
  });
}
