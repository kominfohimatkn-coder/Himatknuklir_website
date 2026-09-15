# HIMATKN Next.js — React Parity Edition

Versi Next.js dari frontend React HIMATKN. Tampilan, class CSS, komponen publik, dashboard admin, dark mode, formulir, dropdown, modal, filter, pencarian, notifikasi, dan alur CRUD berasal langsung dari frontend React yang diberikan.

Backend tetap menggunakan FastAPI. Next.js berfungsi sebagai frontend, server-side renderer untuk halaman publik, dan reverse proxy untuk `/api/*` serta `/uploads/*`.

## Yang dipertahankan dari React

- `HomePage`, termasuk versi mobile ringkas dan versi desktop.
- Header, hamburger menu, drawer, footer, peta, dan identitas Nuclear Green.
- Halaman publikasi, detail publikasi, struktur, dan 404.
- Login admin, dashboard, publikasi, program kerja, pengurus, dan pengaturan.
- Tema admin terang/gelap dan perbaikan hover pada mode gelap.
- Semua CSS dari `index.css` React, termasuk utility Tailwind dan class desain lama.
- Endpoint FastAPI dan bentuk payload yang sama.

## Peningkatan Next.js

- Konten halaman publik sudah dirender pada server, bukan hanya setelah JavaScript berjalan.
- Metadata, canonical, Open Graph, sitemap, robots, dan manifest tersedia.
- Halaman tidak ditemukan mengembalikan status HTTP 404 yang benar.
- Proxy API menangani cookie dan mencegah `ERR_CONTENT_DECODING_FAILED` dari gzip.
- Folder uploads dapat diakses melalui proxy Next.js.
- Route admin diperiksa di server sebelum dashboard ditampilkan.
- Tidak ada global `loading.tsx`; perpindahan admin tidak menampilkan skeleton homepage.

## Menjalankan secara lokal

Pastikan backend FastAPI aktif terlebih dahulu, misalnya:

```bash
cd backend
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Kemudian siapkan frontend:

```bash
cp .env.example .env.local
npm install
npm run dev
```

Buka:

```text
http://localhost:3000
```

Isi `.env.local`:

```env
FASTAPI_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_API_URL` sebaiknya tidak diisi. Browser akan menggunakan `/api/*` dan `/uploads/*` pada domain Next.js, kemudian Next.js meneruskannya ke FastAPI.

## Environment production

Contoh ketika FastAPI sudah berada di VPS:

```env
FASTAPI_BASE_URL=https://api.domain-himatkn.id
NEXT_PUBLIC_SITE_URL=https://domain-himatkn.id
```

Tidak perlu menambahkan trailing slash.

## Deploy ke Vercel

1. Push folder proyek ini ke GitHub.
2. Import repository ke Vercel.
3. Framework preset: `Next.js`.
4. Tambahkan `FASTAPI_BASE_URL` dan `NEXT_PUBLIC_SITE_URL` pada Environment Variables.
5. Deploy.

Frontend dan API browser tetap satu origin karena route `/api/*` diproxy oleh Next.js. Ini mempermudah session cookie dan mengurangi konfigurasi CORS.

## Penyimpanan gambar

Proyek ini tidak mengubah mekanisme penyimpanan backend. Selama FastAPI masih berjalan pada Vercel dengan `/tmp/uploads`, file tetap sementara. Setelah backend dipindahkan ke VPS atau object storage, URL gambar akan tetap bekerja melalui `/uploads/*` atau URL cloud absolut.

## Validasi

Perintah yang sudah lulus:

```bash
npm run lint
npm run build
```

Smoke test juga dilakukan pada route publik, admin, detail berita, proxy API, dan halaman 404 menggunakan mock FastAPI lokal.

## Struktur utama

```text
src/
├── app/                 # routing, SSR, metadata, proxy API
├── components/          # modal, dropdown, loading, empty state
├── context/             # autentikasi admin
├── layouts/             # public dan admin layout dari React
├── lib/                 # API, formatter, maps, config
└── screens/             # halaman React yang dipertahankan
    ├── admin/
    └── public/
```

Folder bernama `screens` digunakan agar Next.js tidak salah menganggap komponen React tersebut sebagai Pages Router.
