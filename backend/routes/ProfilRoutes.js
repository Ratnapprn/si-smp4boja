const express = require("express");
const pool = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM profil_sekolah ORDER BY id ASC LIMIT 1"
    );

    res.json({
      success: true,
      data: result.rows[0] || null,
    });
  } catch (error) {
    console.error("ERROR GET PROFIL:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.put("/", verifyToken, async (req, res) => {
  try {
    const {
      profil = "",
      visi = "",
      misi = "",
      fasilitas = "",
      data_fisik = "",
    } = req.body;

    const existing = await pool.query(
      "SELECT id FROM profil_sekolah ORDER BY id ASC LIMIT 1"
    );

    let result;

    if (existing.rows.length > 0) {
      result = await pool.query(
        `UPDATE profil_sekolah
         SET profil = $1,
             visi = $2,
             misi = $3,
             fasilitas = $4,
             data_fisik = $5
         WHERE id = $6
         RETURNING *`,
        [profil, visi, misi, fasilitas, data_fisik, existing.rows[0].id]
      );
    } else {
      result = await pool.query(
        `INSERT INTO profil_sekolah (
           profil,
           visi,
           misi,
           fasilitas,
           data_fisik
         ) VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [profil, visi, misi, fasilitas, data_fisik]
      );
    }

    res.json({
      success: true,
      message: "Profil sekolah berhasil diperbarui.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("ERROR UPDATE PROFIL:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;