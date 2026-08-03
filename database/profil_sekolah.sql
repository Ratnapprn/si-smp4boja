CREATE TABLE IF NOT EXISTS profil_sekolah (
  id SERIAL PRIMARY KEY,
  profil TEXT,
  visi TEXT,
  misi TEXT,
  fasilitas TEXT,
  data_fisik TEXT
);

ALTER TABLE profil_sekolah
  ADD COLUMN IF NOT EXISTS profil TEXT,
  ADD COLUMN IF NOT EXISTS visi TEXT,
  ADD COLUMN IF NOT EXISTS misi TEXT,
  ADD COLUMN IF NOT EXISTS fasilitas TEXT,
  ADD COLUMN IF NOT EXISTS data_fisik TEXT;

INSERT INTO profil_sekolah (
  profil,
  visi,
  misi,
  fasilitas,
  data_fisik
)
SELECT
  'SMP Negeri 4 Boja Satu Atap merupakan satuan pendidikan jenjang Sekolah Menengah Pertama (SMP) negeri yang berlokasi di Pasigitan, Kecamatan Boja, Kabupaten Kendal, Jawa Tengah. Sebutan “Satu Atap” digunakan karena satuan pendidikan SMP berada dalam satu lingkungan pendidikan dengan sekolah dasar pada lokasi yang sama. Dengan berada dalam satu kawasan, lingkungan dan fasilitas pendidikan dapat dimanfaatkan secara terpadu untuk mendukung kegiatan belajar mengajar.',
  'Menjadi sekolah unggul yang berkarakter, inovatif, dan berprestasi dalam mencetak lulusan yang siap menghadapi tantangan masa depan.',
  '1. Menyelenggarakan pendidikan yang berkarakter dan berakhlak mulia.\n2. Meningkatkan mutu pembelajaran berbasis teknologi dan literasi.\n3. Menumbuhkan semangat prestasi, disiplin, dan kepedulian sosial.',
  'Ruang kelas\nPerpustakaan\nLaboratorium\nRuang komputer\nMusholla\nUKS (Unit Kesehatan Sekolah)\nKamar mandi / WC\nLapangan olahraga',
  'Jumlah ruang kelas: 12\nLuas lahan: 2.500 m2\nJumlah tenaga pendidik: 18\nJumlah siswa: 240'
WHERE NOT EXISTS (SELECT 1 FROM profil_sekolah LIMIT 1);
