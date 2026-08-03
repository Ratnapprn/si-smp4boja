const express = require("express");
const pool = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM kegiatan ORDER BY tanggal DESC, id DESC"
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("ERROR GET KEGIATAN:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/admin", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM kegiatan ORDER BY tanggal DESC, id DESC"
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("ERROR GET KEGIATAN ADMIN:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post("/", verifyToken, upload.single("foto"), async (req, res) => {
  try {
    const { judul, deskripsi, tanggal } = req.body;
    const foto = req.file ? req.file.filename : null;

    if (!judul) {
      return res.status(400).json({
        success: false,
        message: "Judul kegiatan wajib diisi.",
      });
    }

    const result = await pool.query(
      `INSERT INTO kegiatan (judul, deskripsi, tanggal, foto)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [judul, deskripsi || null, tanggal || null, foto]
    );

    res.status(201).json({
      success: true,
      message: "Kegiatan berhasil ditambahkan.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("ERROR TAMBAH KEGIATAN:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.put("/:id", verifyToken, upload.single("foto"), async (req, res) => {
  try {
    const { id } = req.params;
    const { judul, deskripsi, tanggal } = req.body;

    if (!judul) {
      return res.status(400).json({
        success: false,
        message: "Judul kegiatan wajib diisi.",
      });
    }

    const oldData = await pool.query(
      "SELECT * FROM kegiatan WHERE id = $1",
      [id]
    );

    if (oldData.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data kegiatan tidak ditemukan.",
      });
    }

    const foto = req.file ? req.file.filename : oldData.rows[0].foto;

    const result = await pool.query(
      `UPDATE kegiatan
       SET judul = $1,
           deskripsi = $2,
           tanggal = $3,
           foto = $4
       WHERE id = $5
       RETURNING *`,
      [judul, deskripsi || null, tanggal || null, foto, id]
    );

    res.json({
      success: true,
      message: "Kegiatan berhasil diperbarui.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("ERROR EDIT KEGIATAN:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM kegiatan WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data kegiatan tidak ditemukan.",
      });
    }

    res.json({
      success: true,
      message: "Kegiatan berhasil dihapus.",
    });
  } catch (error) {
    console.error("ERROR HAPUS KEGIATAN:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;