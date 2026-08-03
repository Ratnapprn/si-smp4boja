const express = require("express");
const pool = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const XLSX = require("xlsx");

const router = express.Router();

function normalizeKelas(value) {
  const text = String(value ?? "").trim().toUpperCase();
  if (/^VIII(?:\s|$)/.test(text) || /^8(?:\s|[A-Z]|$)/.test(text)) return "VIII";
  if (/^VII(?:\s|$)/.test(text) || /^7(?:\s|[A-Z]|$)/.test(text)) return "VII";
  if (/^IX(?:\s|$)/.test(text) || /^9(?:\s|[A-Z]|$)/.test(text)) return "IX";
  return text;
}

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nis, nama AS nama_siswa,
             CASE
               WHEN UPPER(TRIM(kelas)) LIKE 'VIII%' OR TRIM(kelas) ~ '^8' THEN 'VIII'
               WHEN UPPER(TRIM(kelas)) LIKE 'VII%' OR TRIM(kelas) ~ '^7' THEN 'VII'
               WHEN UPPER(TRIM(kelas)) LIKE 'IX%' OR TRIM(kelas) ~ '^9' THEN 'IX'
               ELSE TRIM(kelas)
             END AS kelas,
             status, created_at
      FROM siswa
      ORDER BY
        CASE
          WHEN UPPER(TRIM(kelas)) LIKE 'VII%' OR TRIM(kelas) ~ '^7' THEN 1
          WHEN UPPER(TRIM(kelas)) LIKE 'VIII%' OR TRIM(kelas) ~ '^8' THEN 2
          WHEN UPPER(TRIM(kelas)) LIKE 'IX%' OR TRIM(kelas) ~ '^9' THEN 3
          ELSE 4
        END,
        LOWER(nama) ASC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("ERROR GET SISWA:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/admin", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nis, nama AS nama_siswa,
             CASE
               WHEN UPPER(TRIM(kelas)) LIKE 'VIII%' OR TRIM(kelas) ~ '^8' THEN 'VIII'
               WHEN UPPER(TRIM(kelas)) LIKE 'VII%' OR TRIM(kelas) ~ '^7' THEN 'VII'
               WHEN UPPER(TRIM(kelas)) LIKE 'IX%' OR TRIM(kelas) ~ '^9' THEN 'IX'
               ELSE TRIM(kelas)
             END AS kelas,
             status, created_at
      FROM siswa
      ORDER BY
        CASE
          WHEN UPPER(TRIM(kelas)) LIKE 'VII%' OR TRIM(kelas) ~ '^7' THEN 1
          WHEN UPPER(TRIM(kelas)) LIKE 'VIII%' OR TRIM(kelas) ~ '^8' THEN 2
          WHEN UPPER(TRIM(kelas)) LIKE 'IX%' OR TRIM(kelas) ~ '^9' THEN 3
          ELSE 4
        END,
        LOWER(nama) ASC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("ERROR GET SISWA ADMIN:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const { nama_siswa, kelas, status } = req.body;

    if (!nama_siswa || !kelas) {
      return res.status(400).json({
        success: false,
        message: "Nama siswa dan kelas wajib diisi."
      });
    }

    const result = await pool.query(
      `INSERT INTO siswa (nama, kelas, status)
       VALUES ($1,$2,$3)
       RETURNING id, nis, nama AS nama_siswa, kelas, status, created_at`,
      [nama_siswa, normalizeKelas(kelas), status || "Aktif"]
    );

    res.status(201).json({
      success: true,
      message: "Data siswa berhasil ditambahkan.",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("ERROR TAMBAH SISWA:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/import", verifyToken, upload.single("excel"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File Excel belum dipilih."
      });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    let berhasil = 0;

    for (const item of data) {
      await pool.query(
        `INSERT INTO siswa (nama, kelas, status)
         VALUES ($1,$2,$3)`,
        [
          item.nama_siswa || item.nama || "",
          normalizeKelas(item.kelas),
          item.status || "Aktif"
        ]
      );
      berhasil++;
    }

    res.json({
      success: true,
      message: `${berhasil} data siswa berhasil diimport.`
    });
  } catch (error) {
    console.error("ERROR IMPORT SISWA:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_siswa, kelas, status } = req.body;

    if (!nama_siswa || !kelas) {
      return res.status(400).json({
        success: false,
        message: "Nama siswa dan kelas wajib diisi."
      });
    }

    const result = await pool.query(
      `UPDATE siswa
       SET nama=$1,
           kelas=$2,
           status=$3
       WHERE id=$4
       RETURNING id, nis, nama AS nama_siswa, kelas, status, created_at`,
      [nama_siswa, normalizeKelas(kelas), status || "Aktif", id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data siswa tidak ditemukan."
      });
    }

    res.json({
      success: true,
      message: "Data siswa berhasil diperbarui.",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("ERROR EDIT SISWA:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM siswa WHERE id=$1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data siswa tidak ditemukan."
      });
    }

    res.json({
      success: true,
      message: "Data siswa berhasil dihapus."
    });
  } catch (error) {
    console.error("ERROR HAPUS SISWA:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;