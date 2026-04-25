# roxy-drachin — Platform streaming drama China

<!-- tambahkan screenshot di sini -->

## Fitur Utama
- Nonton drama China (Drachin) gratis dengan subtitle Indonesia
- Pencarian dan filter drama berdasarkan genre
- Tampilan detail drama beserta sinopsis lengkap
- Navigasi episode yang responsif
- Riwayat tontonan otomatis dengan fitur 'Lanjut Ep'

## Tech Stack
- Vanilla JS ES Modules
- CSS Custom Properties
- PWA (Progressive Web App) dengan Service Worker
- Vercel (Hosting)

## Cara Install & Menjalankan
1. Klon repository ini
2. Buka terminal di dalam folder project
3. Jalankan `npm install` untuk menginstall dependensi (Vitest untuk testing)
4. Jalankan aplikasi menggunakan VSCode Live Server, atau gunakan skrip vite dengan `npx vite`
5. Buka `index.html` di browser
6. Untuk menjalankan tes: `npm test`

## Struktur Folder
```
.
├── assets/       # Gambar, logo, icon
├── css/          # File CSS murni (variables, base, components, pages)
├── js/           # Modul Vanilla JS (api, components, config, security, pages)
├── tests/        # File testing menggunakan Vitest
├── index.html    # Halaman Utama
├── browse.html   # Halaman Daftar & Filter Drama
├── detail.html   # Halaman Informasi & Episode Drama
├── watch.html    # Halaman Player Streaming
├── popular.html  # Halaman Drama Terpopuler
├── search.html   # Halaman Pencarian
├── sw.js         # Service Worker untuk PWA
└── manifest.json # Manifest PWA
```

## Environment & Konfigurasi
URL basis untuk API (endpoint data) diatur di dalam `js/config.js` (`API_BASE_URL`).

## API yang digunakan
Aplikasi ini mengambil data drama melalui API publik: `sankavollerei.com`.

## Deploy ke Vercel
Project ini menggunakan Vercel untuk hosting.
- Menggunakan Vercel CLI: `vercel --prod` di root project.
- Pastikan kamu sudah menghubungkan akun Vercel kamu.

## Lisensi
MIT License
