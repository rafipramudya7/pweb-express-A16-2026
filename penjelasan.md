# 📖 Penjelasan Project MLBB Shop API — Kelompok A16

File ini dibuat khusus untuk teman-teman yang **belum paham sama sekali** tentang project ini.
Di sini dijelaskan: **(1)** package apa saja yang dipakai, **(2)** peta folder beserta kegunaannya, dan **(3)** alur kerja aplikasi secara garis besar.

> Intinya: project ini adalah **REST API** (backend) tentang katalog hero & skin Mobile Legends,
> dibuat dengan **Express (Node.js)** + **Prisma** sebagai penghubung ke database **PostgreSQL (Neon)**.

---

## 1. 📦 Package yang Dipakai

Semua package terdaftar di file `package.json`. Ada 2 jenis:

- **dependencies** → dipakai saat aplikasi **berjalan** (production).
- **devDependencies** → hanya dipakai saat **ngoding / development**, tidak ikut saat aplikasi jalan di server.

### A. Dependencies (dipakai saat aplikasi berjalan)

| Package | Gunanya |
|---|---|
| **express** | Framework utama untuk membuat server & API. Tugasnya menerima request dari client (browser/Postman) lalu mengirimkan response JSON. Semua routing (`/api/heroes`, `/api/skins`) dikelola di sini. |
| **@prisma/client** | "Jembatan" dari kode JavaScript/TypeScript ke database. Kita tidak menulis SQL manual — cukup panggil `prisma.hero.findMany()` dan Prisma yang menerjemahkan jadi query SQL ke PostgreSQL. |
| **@prisma/adapter-neon** | Adapter khusus supaya Prisma bisa terhubung ke database **Neon** (PostgreSQL di cloud, serverless). Lihat pemakaiannya di `src/config/db.ts`. |
| **dotenv** | Membaca file **`.env`** yang berisi rahasia/config (misalnya `DATABASE_URL` dan `PORT`). Jadi password database tidak ditulis langsung di kode — aman dari bocor ke GitHub. |

### B. DevDependencies (hanya untuk development)

| Package | Gunanya |
|---|---|
| **typescript** | Bahasa yang kita pakai. Ini "JavaScript + tipe data", jadi kesalahan ketik terdeteksi sebelum program dijalankan. Dipakai oleh perintah `npm run build`. |
| **tsx** | Menjalankan file TypeScript **langsung** tanpa perlu di-compile dulu. Dipakai di script `npm run dev` (`tsx watch src/server.ts` — otomatis restart tiap kode berubah). |
| **prisma** | CLI (alat baris perintah) Prisma. Dipakai untuk: `prisma migrate dev` (membuat tabel di database), `prisma db seed` (mengisi data awal), dan men-generate client. |
| **@types/express** | "Kamus tipe" TypeScript untuk Express, agar autocomplete & pengecekan tipe Express berfungsi. |
| **@types/node** | "Kamus tipe" TypeScript untuk fitur bawaan Node.js (`fs`, `path`, `process`, dll). |

### C. Perintah `npm run` yang tersedia

| Perintah | Apa yang dilakukan |
|---|---|
| `npm run dev` | Menjalankan server mode development (auto-restart saat file berubah). |
| `npm run build` | Compile TypeScript → JavaScript ke folder `dist/`. |
| `npm start` | Menjalankan hasil build dari `dist/server.js` (mode production). |
| `npm run db:migrate` | Membuat/menyesuaikan tabel di database sesuai `prisma/schema.prisma`. |
| `npm run seed` | Mengisi database dengan data awal dari `data/heroes.json` & `data/skins.json`. |

---

## 2. 🗺️ Peta Folder & Kegunaannya

```
pweb-express-A16-2026/
│
├── src/                      ← 🧠 OTAK APLIKASI (semua kode backend di sini)
│   ├── server.ts             ← Titik masuk (entry point). Menyalakan server & baca .env
│   ├── app.ts                ← Mengatur Express: middleware, static file, dan daftar route
│   │
│   ├── config/
│   │   └── db.ts             ← Koneksi ke database (membuat 1 object `prisma`
│   │                            yang dipakai ulang di seluruh aplikasi)
│   │
│   ├── controllers/          ← 🎮 ISI LOGIKA (apa yang terjadi saat endpoint dipanggil)
│   │   ├── heroController.ts ←   Logika hero: list + filter + pagination, detail, create
│   │   └── skinController.ts ←   Logika skin: list + pagination, detail
│   │
│   ├── routes/               ← 🚪 PINTU (memetakan URL → fungsi controller)
│   │   ├── heroRoutes.ts     ←   GET /, GET /:hero_id, POST /  untuk /api/heroes
│   │   └── skinRoutes.ts     ←   GET /, GET /:skin_id           untuk /api/skins
│   │
│   ├── middlewares/          ← 🛡️ PENJAGA (kode yang jalan SEBELUM/SESUDAH controller)
│   │   ├── logger.ts         ←   Mencatat tiap request: method, URL, status, durasi
│   │   ├── notFound.ts       ←   Menjawab 404 jika URL tidak terdaftar di route manapun
│   │   └── errorHandler.ts   ←   Menangkap semua error & mengubahnya jadi JSON rapi
│   │                            (termasuk error khusus Prisma: P2002 duplikat, P2025 tidak ada)
│   │
│   ├── utils/                ← 🔧 ALAT BANTU (fungsi kecil yang dipakai berulang)
│   │   ├── http-error.ts     ←   Class HttpError: error custom bawa status code (400/404/409)
│   │   ├── parse.ts          ←   parsePagination (page/limit/skip/take) & parseId (validasi id)
│   │   └── response.ts       ←   Format JSON baku: { status, message, data, metadata }
│   │
│   └── generated/            ← ⚙️ HASIL GENERATE (JANGAN DIEDIT MANUAL!)
│       └── prisma/           ←   Kode Prisma Client yang dibuat otomatis dari schema.
│                                  Di-generate ulang dengan `prisma generate`.
│
├── prisma/                   ← 🗄️ ATURAN DATABASE
│   ├── schema.prisma         ←   "Blue-print" tabel: Hero, Skin, dan enum (Role, Lane, dll)
│   ├── seed.ts               ←   Script isi data awal ke database
│   └── migrations/           ←   Catatan perubahan struktur database (dibuat oleh prisma migrate)
│
├── public/                   ← 🖥️ TAMPILAN FRONTEND (HTML/CSS/JS biasa)
│   ├── index.html            ←   Halaman web "MLBB Store" yang memanggil API ini
│   ├── css/style.css         ←   Styling halaman
│   ├── js/app.js             ←   Fetch data dari /api/heroes & /api/skins lalu dirender
│   └── hero-images.json      ←   Data URL gambar hero untuk halaman web
│
├── data/                     ← 📂 SUMBER DATA MENTAH
│   ├── heroes.json           ←   Data hero (dipakai seed.ts)
│   └── skins.json            ←   Data skin (dipakai seed.ts)
│
├── postman/
│   └── MLBB-Shop-Testcase.postman_collection.json ← Koleksi test case untuk Postman
│
├── .env                      ← 🔑 RAHASIA (DATABASE_URL, PORT) — tidak di-commit ke Git
├── .env.example              ← Contoh isi .env (tanpa password asli)
├── package.json              ← Daftar package + script npm
├── tsconfig.json             ← Konfigurasi TypeScript
├── prisma.config.ts          ← Konfigurasi Prisma (lokasi schema, migrations, seed)
└── penjelasan.md             ← File ini 🙂
```

> ⚠️ Folder `.agents/` hanya berisi dokumentasi bantuan AI/tool pengembangan — **tidak ada hubungannya dengan aplikasi**. Jangan diubah.

---

## 3. 🔄 Alur Kerja Aplikasi (Biar Kebayang)

Ketika seseorang membuka `GET /api/heroes?page=1&limit=10&search=lay&role=MAGE`:

```
Browser / Postman
      │
      ▼
server.ts  → menyalakan Express, membaca .env (PORT, DATABASE_URL)
      ▼
app.ts     → middleware logger mencatat request,
             lalu URL "/api/heroes" diteruskan ke heroRoutes.ts
      ▼
heroRoutes.ts → mencocokkan: GET "/" → panggil fungsi getHeroes
      ▼
heroController.ts →
      1. parsePagination()  : page=1, limit=10 → skip=0, take=10
      2. validasi role      : kalau tidak ada di daftar → lempar HttpError(400)
      3. prisma.hero.findMany() + count()  → Prisma menerjemahkan jadi SQL:
         SELECT ... FROM "Hero" WHERE "name" ILIKE '%lay%' AND "role"='MAGE'
         LIMIT 10 OFFSET 0;
      ▼
config/db.ts → adapter Neon mengirim query itu ke database PostgreSQL di Neon (cloud)
      ▼
response.ts → dibungkus format baku:
      { "status": true, "message": "Berhasil mengambil data hero",
        "data": [...], "metadata": { "currentPage": 1, "limit": 10, "totalItems": 12, "totalPages": 2 } }
      ▼
errorHandler.ts → kalau di tengah jalan ada error, di sini ditangkap & diubah jadi
      { "status": false, "message": "..." } dengan status code yang tepat
```

### Analogi sederhana 🏢
Bayangkan aplikasi ini seperti **restoran**:
- **routes/** = daftar menu di pintu (pengunjung pesan lewat sini)
- **controllers/** = dapur (tempat pesanan diolah)
- **middlewares/** = satpam & kasir (mencatat, menyaring, menangani masalah)
- **utils/** = peralatan dapur yang dipakai semua juru masak
- **config/db.ts + Prisma** = pelayan yang mengantar pesanan ke gudang bahan (database Neon)
- **public/** = area ruang makan tempat pelanggan melihat katalog

---

## 4. 🚀 Cara Menjalankan (untuk pemula)

1. **Install package** (sekali saja setelah clone):
   ```
   npm install
   ```
2. **Buat file `.env`** — salin dari `.env.example`, lalu isi `DATABASE_URL` dengan kredensial Neon kelompok.
3. **Buat tabel & isi data** (kalau database masih kosong):
   ```
   npm run db:migrate
   npm run seed
   ```
4. **Nyalakan server:**
   ```
   npm run dev
   ```
5. **Coba di browser / Postman:**
   - `http://localhost:3000/health` → cek server & database hidup
   - `http://localhost:3000/api/heroes` → daftar hero
   - `http://localhost:3000/api/skins` → daftar skin
   - `http://localhost:3000/` → halaman web MLBB Store

> 💡 Import file `postman/MLBB-Shop-Testcase.postman_collection.json` ke Postman untuk mencoba semua test case yang sudah disiapkan.
