import type { Request, Response } from "express";

// Middleware 404 untuk request yang tidak cocok dengan route manapun (testcase 28).
export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    status: "error",
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`,
    data: null,
  });
}
