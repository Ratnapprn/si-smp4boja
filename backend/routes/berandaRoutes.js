const express = require("express");
const pool = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM konten_beranda ORDER BY id ASC LIMIT 1"
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("ERROR GET BERANDA:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.put("/", verifyToken, async (req, res) => {
  try {
    const {
      judul,
      deskripsi,
      teks_tombol_utama,
      teks_tombol_kedua,
    } = req.body;

    const result = await pool.query(
      `UPDATE konten_beranda
       SET judul = $1,
           deskripsi = $2,
           teks_tombol_utama = $3,
           teks_tombol_kedua = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT id FROM konten_beranda ORDER BY id ASC LIMIT 1)
       RETURNING *`,
      [
        judul,
        deskripsi,
        teks_tombol_utama,
        teks_tombol_kedua,
      ]
    );

    res.json({
      success: true,
      message: "Konten beranda berhasil diperbarui.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("ERROR UPDATE BERANDA:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;