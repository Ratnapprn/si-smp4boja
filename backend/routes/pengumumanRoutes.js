const express = require("express");
const pool = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const router = express.Router();

// GET semua pengumuman aktif untuk halaman publik
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM pengumuman WHERE status = 'Aktif' ORDER BY tanggal DESC, id DESC"
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data pengumuman",
    });
  }
});

// GET semua pengumuman untuk dashboard admin
router.get("/admin", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM pengumuman ORDER BY tanggal DESC, id DESC"
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data pengumuman admin",
    });
  }
});

// POST tambah pengumuman
router.post("/", verifyToken, upload.single("foto"), async (req, res) => {
  try {
    const { judul, isi, tanggal, status } = req.body;
    const foto = req.file ? req.file.filename : null;

    if (!judul || !isi) {
      return res.status(400).json({
        success: false,
        message: "Judul dan isi pengumuman wajib diisi",
      });
    }

    const result = await pool.query(
      `INSERT INTO pengumuman (judul, isi, tanggal, status, foto)
       VALUES ($1, $2, COALESCE($3, CURRENT_DATE), COALESCE($4, 'Aktif'), $5)
       RETURNING *`,
      [judul, isi, tanggal || null, status || "Aktif", foto]
    );

    res.status(201).json({
      success: true,
      message: "Pengumuman berhasil ditambahkan",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Gagal menambahkan pengumuman",
    });
  }
});

// PUT edit pengumuman
router.put("/:id", verifyToken, upload.single("foto"), async (req, res) => {
  try {
    const { id } = req.params;
    const { judul, isi, tanggal, status } = req.body;
    const foto = req.file ? req.file.filename : null;

    if (!judul || !isi) {
      return res.status(400).json({
        success: false,
        message: "Judul dan isi pengumuman wajib diisi",
      });
    }

    const result = await pool.query(
      `UPDATE pengumuman
       SET judul = $1, isi = $2, tanggal = $3, status = $4, foto = COALESCE($5, foto)
       WHERE id = $6
       RETURNING *`,
      [judul, isi, tanggal, status, foto, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pengumuman tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "Pengumuman berhasil diperbarui",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Gagal memperbarui pengumuman",
    });
  }
});

// DELETE hapus pengumuman
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM pengumuman WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pengumuman tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "Pengumuman berhasil dihapus",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus pengumuman",
    });
  }
});

module.exports = router;