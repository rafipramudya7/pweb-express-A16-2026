import "dotenv/config";
import { PrismaClient } from "../generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";

// Koneksi runtime memakai POOLED connection (DATABASE_URL, hostname "-pooler")
// lewat Neon serverless adapter — sesuai panduan resmi Prisma 7 + Neon.
const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });
