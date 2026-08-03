const express = require("express");
const pool = require("../config/db");

const router = express.Router();

function csvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function sendCsv(res, filename, headers, rows) {
  const csv = [
    headers.map(csvCell).join(","),
    ...rows.map(row => row.map(csvCell).join(","))
  ].join("\r\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send("\uFEFF" + csv);
}

router.get("/pengumuman", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT tanggal, judul, isi, status
      FROM pengumuman
      WHERE status = 'Aktif'
      ORDER BY tanggal DESC, id DESC
    `);

    const rows = result.rows.map(item => [
      item.tanggal,
      item.judul,
      item.isi,
      item.status
    ]);

    sendCsv(
      res,
      "rangkuman-pengumuman-smp-negeri-4-boja.csv",
      ["Tanggal", "Judul", "Isi Pengumuman", "Status"],
      rows
    );
  } catch (error) {
    console.error("GET /api/unduh/pengumuman:", error);
    res.status(500).json({ success: false, message: "Gagal membuat rangkuman pengumuman." });
  }
});

router.get("/jadwal", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT periode, jenis, hari,
             TO_CHAR(jam_mulai, 'HH24:MI') AS jam_mulai,
             TO_CHAR(jam_selesai, 'HH24:MI') AS jam_selesai,
             kelas, mata_pelajaran, guru, keterangan
      FROM jadwal
      ORDER BY
        CASE hari
          WHEN 'Senin' THEN 1
          WHEN 'Selasa' THEN 2
          WHEN 'Rabu' THEN 3
          WHEN 'Kamis' THEN 4
          WHEN 'Jumat' THEN 5
          WHEN 'Sabtu' THEN 6
          WHEN 'Minggu' THEN 7
          ELSE 8
        END,
        jam_mulai,
        CASE kelas
          WHEN 'VII' THEN 1
          WHEN 'VIII' THEN 2
          WHEN 'IX' THEN 3
          ELSE 4
        END,
        id
    `);

    const rows = result.rows.map(item => [
      item.periode,
      item.jenis,
      item.hari,
      item.jam_mulai,
      item.jam_selesai,
      item.kelas,
      item.mata_pelajaran,
      item.guru,
      item.keterangan
    ]);

    sendCsv(
      res,
      "rangkuman-jadwal-smp-negeri-4-boja.csv",
      ["Periode", "Jenis", "Hari", "Jam Mulai", "Jam Selesai", "Kelas", "Mata Pelajaran/Kegiatan", "Guru/Pembina", "Keterangan"],
      rows
    );
  } catch (error) {
    console.error("GET /api/unduh/jadwal:", error);
    res.status(500).json({ success: false, message: "Gagal membuat rangkuman jadwal." });
  }
});

router.get("/guru", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT nama, mata_pelajaran, jabatan
      FROM guru
      ORDER BY LOWER(nama) ASC
    `);

    const rows = result.rows.map(item => [
      item.nama,
      item.mata_pelajaran,
      item.jabatan
    ]);

    sendCsv(
      res,
      "rangkuman-data-guru-smp-negeri-4-boja.csv",
      ["Nama Guru", "Mata Pelajaran", "Jabatan"],
      rows
    );
  } catch (error) {
    console.error("GET /api/unduh/guru:", error);
    res.status(500).json({ success: false, message: "Gagal membuat rangkuman data guru." });
  }
});

router.get("/siswa", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT nama, kelas, status
      FROM siswa
      ORDER BY
        CASE
          WHEN UPPER(TRIM(kelas)) LIKE 'VIII%' OR TRIM(kelas) ~ '^8' THEN 2
          WHEN UPPER(TRIM(kelas)) LIKE 'VII%' OR TRIM(kelas) ~ '^7' THEN 1
          WHEN UPPER(TRIM(kelas)) LIKE 'IX%' OR TRIM(kelas) ~ '^9' THEN 3
          ELSE 4
        END,
        LOWER(nama) ASC
    `);

    const rows = result.rows.map(item => [
      item.nama,
      item.kelas,
      item.status
    ]);

    sendCsv(
      res,
      "rangkuman-data-siswa-smp-negeri-4-boja.csv",
      ["Nama Siswa", "Kelas", "Status"],
      rows
    );
  } catch (error) {
    console.error("GET /api/unduh/siswa:", error);
    res.status(500).json({ success: false, message: "Gagal membuat rangkuman data siswa." });
  }
});

module.exports = router;
