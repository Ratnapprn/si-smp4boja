# SI-SMP4BOJA

Sistem Informasi Sekolah untuk SMP 4 Boja yang digunakan untuk mengelola data profil sekolah, pengumuman, jadwal, dokumen, kegiatan, guru, siswa, izin, serta pengaduan secara terpusat melalui antarmuka web.

## Deskripsi

Proyek ini terdiri dari:

- Backend berbasis Node.js dan Express
- Frontend statis menggunakan HTML, CSS, dan JavaScript
- Database PostgreSQL
- API REST untuk pengelolaan data admin dan publik

Aplikasi ini menyajikan halaman seperti:

- Beranda
- Profil sekolah
- Data guru
- Data siswa
- Jadwal
- Kegiatan
- Pengumuman
- Izin
- Pengaduan
- Download
- Login admin

## Teknologi yang Digunakan

- Node.js
- Express.js
- PostgreSQL
- pg (PostgreSQL client)
- JWT
- bcryptjs
- multer
- cors
- xlsx
- HTML/CSS/JavaScript

## Struktur Proyek

```text
si-smp4boja/
├─ backend/
│  ├─ config/
│  ├─ controllers/
│  ├─ middleware/
│  ├─ models/
│  ├─ routes/
│  ├─ uploads/
│  ├─ server.js
│  └─ package.json
├─ database/
│  └─ profil_sekolah.sql
├─ frontend/
│  ├─ css/
│  ├─ img/
│  ├─ js/
│  └─ *.html
└─ README.md
```

## Persyaratan

Sebelum menjalankan proyek, pastikan mesin Anda sudah memiliki:

- Node.js v18+
- npm
- PostgreSQL
- Browser modern

## Setup Environment

1. Buka folder backend:

```bash
cd backend
```

2. Install dependency:

```bash
npm install
```

3. Buat file `.env` di dalam folder `backend` berdasarkan konfigurasi database berikut:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nama_database
DB_USER=postgres
DB_PASSWORD=password_anda
API_URL=/api
```

4. Buat database PostgreSQL sesuai dengan konfigurasi di `.env`.

5. Impor struktur database jika diperlukan:

```bash
psql -U postgres -d nama_database -f ../database/profil_sekolah.sql
```

## Menjalankan Aplikasi

### Backend

```bash
cd backend
npm start
```

Untuk mode pengembangan:

```bash
cd backend
npm run dev
```

Server default akan berjalan pada:

```text
http://localhost:5000
```

Frontend statis akan disajikan langsung dari folder `frontend` melalui Express.

## Fitur Utama

- Manajemen profil sekolah
- Pengelolaan pengumuman sekolah
- Informasi jadwal pelajaran
- Data guru dan siswa
- Kegiatan sekolah
- Pelayanan izin
- Pengaduan masyarakat
- Download dokumen dan file
- Autentikasi admin dengan JWT

## API Umum

Beberapa endpoint utama yang tersedia:

- `/api/admin`
- `/api/pengumuman`
- `/api/izin`
- `/api/pengaduan`
- `/api/guru`
- `/api/siswa`
- `/api/dokumen`
- `/api/kegiatan`
- `/api/jadwal`
- `/api/profil`
- `/api/beranda`
- `/api/unduh`

## Catatan Pengembangan

- Folder `frontend` berfungsi sebagai antarmuka pengguna yang disajikan oleh Express.
- Folder `uploads` digunakan untuk menyimpan file unggahan seperti dokumen atau foto.
- Beberapa fungsi pada backend secara otomatis memastikan skema tabel penting ada saat server dijalankan.

## Kontribusi

Silakan buat branch baru dan lakukan pull request untuk setiap perubahan yang ingin disumbangkan.

## Lisensi

Proyek ini menggunakan lisensi ISC.
