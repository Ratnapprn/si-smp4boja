require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const pool = require("./config/db");

const adminRoutes = require("./routes/adminRoutes");
const pengumumanRoutes = require("./routes/pengumumanRoutes");
const izinRoutes = require("./routes/izinRoutes");
const pengaduanRoutes = require("./routes/pengaduanRoutes");
const guruRoutes = require("./routes/guruRoutes");
const siswaRoutes = require("./routes/siswaRoutes");
const dokumenRoutes = require("./routes/dokumenRoutes");
const kegiatanRoutes = require("./routes/kegiatanRoutes");
const jadwalRoutes = require("./routes/jadwalRoutes");
const profilRoutes = require("./routes/ProfilRoutes");
const berandaRoutes = require("./routes/berandaRoutes");
const downloadRoutes = require("./routes/downloadRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/config.js", (req, res) => {
  const apiUrl = process.env.API_URL || "/api";
  const baseUrl = apiUrl.replace(/\/api\/?$/, "");

  res.type("application/javascript").send(
    `window.API_URL=${JSON.stringify(apiUrl)};window.BASE_URL=${JSON.stringify(baseUrl)};`
  );
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, waktu: result.rows[0] });
  } catch (error) {
    console.error("TEST DATABASE:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/config", (req, res) => {
  res.json({
    success: true,
    apiUrl: process.env.API_URL || "/api"
  });
});

app.use("/api/admin", adminRoutes);
app.use("/api/pengumuman", pengumumanRoutes);
app.use("/api/izin", izinRoutes);
app.use("/api/pengaduan", pengaduanRoutes);
app.use("/api/guru", guruRoutes);
app.use("/api/siswa", siswaRoutes);
app.use("/api/dokumen", dokumenRoutes);
app.use("/api/kegiatan", kegiatanRoutes);
app.use("/api/jadwal", jadwalRoutes);
app.use("/api/profil", profilRoutes);
app.use("/api/beranda", berandaRoutes);
app.use("/api/unduh", downloadRoutes);

async function ensureProfilSekolahSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS profil_sekolah (
      id SERIAL PRIMARY KEY,
      profil TEXT,
      visi TEXT,
      misi TEXT,
      fasilitas TEXT,
      data_fisik TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`ALTER TABLE profil_sekolah ADD COLUMN IF NOT EXISTS profil TEXT`);
  await pool.query(`ALTER TABLE profil_sekolah ADD COLUMN IF NOT EXISTS visi TEXT`);
  await pool.query(`ALTER TABLE profil_sekolah ADD COLUMN IF NOT EXISTS misi TEXT`);
  await pool.query(`ALTER TABLE profil_sekolah ADD COLUMN IF NOT EXISTS fasilitas TEXT`);
  await pool.query(`ALTER TABLE profil_sekolah ADD COLUMN IF NOT EXISTS data_fisik TEXT`);
}

async function ensurePengumumanSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pengumuman (
      id SERIAL PRIMARY KEY,
      judul TEXT NOT NULL,
      isi TEXT NOT NULL,
      tanggal DATE,
      status VARCHAR(20) DEFAULT 'Aktif',
      foto TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`ALTER TABLE pengumuman ADD COLUMN IF NOT EXISTS foto TEXT`);
}

async function ensureJadwalSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jadwal (
      id SERIAL PRIMARY KEY,
      periode VARCHAR(50),
      jenis VARCHAR(30),
      hari VARCHAR(20),
      jam_mulai TIME,
      jam_selesai TIME,
      kelas VARCHAR(30),
      mata_pelajaran VARCHAR(150),
      guru VARCHAR(150),
      keterangan TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`ALTER TABLE jadwal ADD COLUMN IF NOT EXISTS periode VARCHAR(50)`);
  await pool.query(`ALTER TABLE jadwal ADD COLUMN IF NOT EXISTS jenis VARCHAR(30)`);
  await pool.query(`ALTER TABLE jadwal ADD COLUMN IF NOT EXISTS hari VARCHAR(20)`);
  await pool.query(`ALTER TABLE jadwal ADD COLUMN IF NOT EXISTS jam_mulai TIME`);
  await pool.query(`ALTER TABLE jadwal ADD COLUMN IF NOT EXISTS jam_selesai TIME`);
  await pool.query(`ALTER TABLE jadwal ADD COLUMN IF NOT EXISTS kelas VARCHAR(30)`);
  await pool.query(`ALTER TABLE jadwal ALTER COLUMN kelas TYPE VARCHAR(30)`);
  await pool.query(`ALTER TABLE jadwal ADD COLUMN IF NOT EXISTS mata_pelajaran VARCHAR(150)`);
  await pool.query(`ALTER TABLE jadwal ADD COLUMN IF NOT EXISTS guru VARCHAR(150)`);
  await pool.query(`ALTER TABLE jadwal ADD COLUMN IF NOT EXISTS keterangan TEXT`);
  await pool.query(`ALTER TABLE jadwal ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  await pool.query(`ALTER TABLE jadwal ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);

  // Kompatibilitas dengan struktur tabel jadwal versi lama.
  // Kolom lama yang masih wajib diisi dibuat opsional agar jadwal manual baru dapat disimpan.
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'jadwal' AND column_name = 'nama_jadwal'
      ) THEN
        ALTER TABLE jadwal ALTER COLUMN nama_jadwal DROP NOT NULL;
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'jadwal' AND column_name = 'file'
      ) THEN
        ALTER TABLE jadwal ALTER COLUMN file DROP NOT NULL;
      END IF;
    END $$;
  `);

  await pool.query(`ALTER TABLE dokumen ADD COLUMN IF NOT EXISTS keterangan TEXT`);
}

async function ensureSiswaClassData() {
  // Menjaga data tingkat kelas sesuai data sekolah yang diimpor.
  // Operasi ini idempoten sehingga aman dijalankan setiap server start.
  const kelas8Names = [
    "ABDUL LATIF", "AHMAD HANIF AMINUDIN", "AKHMAD HARIS SIDIQ",
    "AKMAL ZUHAIR RIZKUNA", "ARFI KHUMAERA SAFITRI", "DWI PRASETYO NUGROHO",
    "EKA FEBRIANA", "FITRI SEPTI AULIA", "GANDA RIZKY CALLYSTA",
    "HABIB AHMAD FADZIL", "IBNU GALANG PRASETYO", "INAYAH",
    "KIRANA DWI CAHYA", "MUHAMMAD ARYA ARJANA", "MUHAMMAD ILHAM SOFYAN HUSEIN",
    "MUHAMMAD REVALIZA AKBAR", "NAUVALE ADI SAPUTRA", "NINDIA DINDA PUTRI",
    "PUTRI KIRANA CAHYA", "RAFAEL HIDAYATUL MUTTAQIN", "RAFFI CATUR PUTRA",
    "RARA DWI ANGGRAENI", "RASYA APRILIAN AQIANA", "RATIH KUMALA DEWI",
    "REGINA PUTRI DWI ANJANI", "RENDY AGUSTIAN", "RIZQI ADE WIDODO",
    "SUSANTO DHODY KUNCORO", "SYIFA NIFALDI", "TATA PRADESTA WAHYONO",
    "UMMU SALMA MIFLAKHUL IZZAH", "VARADILA FATIMATUL HIKMAH"
  ];

  await pool.query(`
    UPDATE siswa
    SET kelas = 'VIII'
    WHERE UPPER(TRIM(nama)) = ANY($1::text[])
  `, [kelas8Names]);

  await pool.query(`
    UPDATE siswa
    SET kelas = 'IX'
    WHERE UPPER(TRIM(kelas)) IN ('9A', '9B', 'IXA', 'IXB')
  `);
}

async function startServer() {
  try {
    await ensureProfilSekolahSchema();
    await ensurePengumumanSchema();
    await ensureJadwalSchema();
    await ensureSiswaClassData();
    console.log("Database profil sekolah, pengumuman, jadwal, dan data tingkat siswa siap.");

    app.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Gagal menyiapkan database:", error.code || error.message || error);
    process.exit(1);
  }
}


startServer();
