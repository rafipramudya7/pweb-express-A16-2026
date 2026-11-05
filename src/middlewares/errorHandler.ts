import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../generated/prisma";
import { HttpError } from "../utils/http-error";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      status: false,
      message: err.message,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        status: false,
        message: "Data sudah ada (melanggar constraint unik)",
      });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({
        status: false,
        message: "Data tidak ditemukan",
      });
      return;
    }
  }

  console.error("[errorHandler]", err);
  res.status(500).json({
    status: false,
    message: "Terjadi kesalahan internal pada server",
  });
}
