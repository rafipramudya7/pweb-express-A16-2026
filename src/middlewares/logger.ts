import type { NextFunction, Request, Response } from "express";

// Middleware logging sederhana: method, url, status code, dan durasi.
export function logger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`,
    );
  });
  next();
}
