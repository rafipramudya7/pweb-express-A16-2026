# 🛡️ MLBB Shop — Backend Express (Kelompok A16)

Backend Express 5 + TypeScript + Prisma ORM 7 + PostgreSQL (Neon) untuk penugasan Modul 4 PemWeb.
Termasuk **frontend MLBB Store** bergaya store in-game (dikerjakan oleh bagian A).

---

## 👥 Pembagian Tugas

| Anggota | Peran | Bagian |
| :--- | :--- | :--- |
| **A** | Lead Setup & Catalog Engineer | Setup project, skema Prisma, seeder, middleware, endpoint Hero & Skin, frontend store |
| **B** | Player & Economy Engineer | CRUD Player, Top-Up Diamond, Match BP Rewards |
| **C** | Shop Engine & Analytics Engineer | Beli Hero (transaction), Statistics, integrasi & Postman |

Detail: [`pembagian_tugas_kelompok_a16.md`](./pembagian_tugas_kelompok_a16.md)

---

## 🚀 Cara Menjalankan (lokal)

> **Prasyarat:** Node.js 20.19+/22.12+/24, akun Neon (gratis) dengan CLI `neon` (opsional).

1. **Install dependensi**
   ```bash
   npm install
   ```

2. **Siapkan environment** — salin `.env.example` menjadi `.env`, lalu isi kedua koneksi Neon:
   ```bash
   cp .env.example .env
   ```
   Cara otomatis (disarankan): `neon login` lalu `neon link` — variabel terisi sendiri.
   - `DATABASE_URL` = koneksi **pooled** (`-pooler`) untuk aplikasi
   - `DATABASE_URL_UNPOOLED` = koneksi **direct** untuk migrasi/seed

3. **Migrasi & seed**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```
   Hasil seeder: **133 Hero, 892 Skin, 3 Player** (10.000 BP, 0 Diamond).

4. **Jalankan server**
   ```bash
   npm run dev
   ```
   | URL | Keterangan |
   |---|---|
   | http://localhost:3000 | 🛍️ Frontend MLBB Store |
   | http://localhost:3000/health | Health check |

---

## 🔌 Endpoint (Bagian A)

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/health` | Cek server & koneksi database |
| GET | `/api/heroes` | Daftar hero — `page`, `limit`, `search`, `role` |
| GET | `/api/heroes/:hero_id` | Detail hero + relasi skin |
| POST | `/api/heroes` | Buat hero (400 data kurang, 409 nama duplikat) |
| GET | `/api/skins` | Daftar skin + nama hero — `page`, `limit`, `heroId`, `rarity` |
| GET | `/api/skins/:skin_id` | Detail skin + relasi hero |

Format respons standar:
```json
{
  "status": "success",
  "message": "Berhasil mengambil 5 hero",
  "data": [],
  "metadata": { "page": 1, "limit": 5, "totalItems": 133, "totalPages": 27 }
}
```

Endpoint bagian B & C (`/api/players/*`, `/api/statistics`) menyusul pada integrasi —
lihat `postman/MLBB-Shop-Testcase.postman_collection.json` (28 testcase resmi).

---

## 🗂️ Struktur Project

```
├── prisma/
│   ├── schema.prisma        # 4 model + 4 enum (Role, Lane, Rarity, Currency)
│   └── seed.ts              # seeder 133 hero + 892 skin + 3 player
├── data/                    # dataset JSON (hasil konversi "Mlbb Dataset/*.csv")
├── src/
│   ├── server.ts            # entry point
│   ├── app.ts               # express app + static frontend
│   ├── config/db.ts         # PrismaClient + adapter Neon (pooled)
│   ├── controllers/         # heroController, skinController
│   ├── middlewares/         # logger, notFound, errorHandler
│   ├── routes/              # heroRoutes, skinRoutes
│   └── utils/               # http-error, response, parse
├── public/                  # frontend MLBB Store (vanilla HTML/CSS/JS)
├── postman/                 # collection 28 testcase resmi
└── prisma.config.ts         # konfigurasi Prisma 7 (koneksi direct untuk CLI)
```

## 🖼️ Sumber Gambar Frontend

Potret hero diambil dari CDN resmi MLBB (pemetaan `hero-images.json`, di-generate dari
[gist vsec7](https://gist.github.com/vsec7/73c6dedea092fca8e0a94d448000226c) — `mlid` = id hero).
Hero tanpa potret memakai fallback inisial. Dataset asli: folder `Mlbb Dataset/`.

## 🧪 Pengujian

Import `postman/MLBB-Shop-Testcase.postman_collection.json` ke Postman, jalankan `npx prisma db seed`
terlebih dahulu, lalu eksekusi testcase **01 → 28 berurutan**.
