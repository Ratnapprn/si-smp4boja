const express = require("express");
const pool = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");
const multer = require("multer");
const XLSX = require("xlsx");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nama AS nama_guru, mata_pelajaran, jabatan, foto, created_at
      FROM guru
      ORDER BY id DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("ERROR GET GURU:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/admin", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nama AS nama_guru, mata_pelajaran, jabatan, foto, created_at
      FROM guru
      ORDER BY id DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("ERROR GET GURU ADMIN:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const { nama_guru, mata_pelajaran, jabatan } = req.body;

    if (!nama_guru) {
      return res.status(400).json({
        success: false,
        message: "Nama guru wajib diisi.",
      });
    }

    const result = await pool.query(
      `INSERT INTO guru (nama, mata_pelajaran, jabatan)
       VALUES ($1,$2,$3)
       RETURNING id,nama AS nama_guru,mata_pelajaran,jabatan,foto,created_at`,
      [nama_guru, mata_pelajaran || null, jabatan || null]
    );

    res.status(201).json({
      success: true,
      message: "Data guru berhasil ditambahkan.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("ERROR TAMBAH GURU:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post(
  "/import",
  verifyToken,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Silakan pilih file Excel.",
        });
      }

      const workbook = XLSX.read(req.file.buffer, {
        type: "buffer",
      });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);

      let total = 0;

      for (const row of data) {
        const nama = row.nama || row.Nama || row["Nama Guru"];
        const mapel =
          row.mata_pelajaran ||
          row["Mata Pelajaran"] ||
          row.Mapel;
        const jabatan = row.jabatan || row.Jabatan;

        if (!nama) continue;

        await pool.query(
          `INSERT INTO guru (nama,mata_pelajaran,jabatan)
           VALUES ($1,$2,$3)`,
          [nama, mapel || null, jabatan || null]
        );

        total++;
      }

      res.json({
        success: true,
        message: `${total} data guru berhasil diimport.`,
      });
    } catch (error) {
      console.error("ERROR IMPORT GURU:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_guru, mata_pelajaran, jabatan } = req.body;

    if (!nama_guru) {
      return res.status(400).json({
        success: false,
        message: "Nama guru wajib diisi.",
      });
    }

    const result = await pool.query(
      `UPDATE guru
       SET nama=$1,
           mata_pelajaran=$2,
           jabatan=$3
       WHERE id=$4
       RETURNING id,nama AS nama_guru,mata_pelajaran,jabatan,foto,created_at`,
      [nama_guru, mata_pelajaran || null, jabatan || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data guru tidak ditemukan.",
      });
    }

    res.json({
      success: true,
      message: "Data guru berhasil diperbarui.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("ERROR EDIT GURU:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM guru WHERE id=$1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data guru tidak ditemukan.",
      });
    }

    res.json({
      success: true,
      message: "Data guru berhasil dihapus.",
    });
  } catch (error) {
    console.error("ERROR HAPUS GURU:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;