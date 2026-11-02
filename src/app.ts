import path from "node:path";
import express from "express";
import { prisma } from "./config/db";
import { logger } from "./middlewares/logger";
import { notFound } from "./middlewares/notFound";
import { errorHandler } from "./middlewares/errorHandler";
import heroRoutes from "./routes/heroRoutes";
import skinRoutes from "./routes/skinRoutes";
import { fail, success } from "./utils/response";

const app = express();

app.use(express.json());
app.use(logger);

// Frontend statis (MLBB Store) — public/index.html
app.use(express.static(path.join(__dirname, "..", "public")));

// GET /health — cek server & koneksi database Neon
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    success(res, {
      message: "Server dan database Neon berjalan normal",
      data: { server: "up", database: "up" },
    });
  } catch {
    fail(res, 503, "Database tidak dapat dijangkau", { server: "up", database: "down" });
  }
});

// Modul katalog (bagian A)
app.use("/api/heroes", heroRoutes);
app.use("/api/skins", skinRoutes);

// Modul lain menyusul di sini:
// app.use("/api/players", playerRoutes);   // bagian B
// app.use("/api/statistics", ...);          // bagian C

// 404 untuk endpoint tak dikenal, lalu error handler terpusat
app.use(notFound);
app.use(errorHandler);

export default app;
