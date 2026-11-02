import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7: koneksi CLI (migrate/seed) memakai koneksi DIRECT (tanpa -pooler).
// Runtime aplikasi memakai koneksi POOLED lewat adapter @prisma/adapter-neon (lihat src/config/db.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL_UNPOOLED"),
  },
});
