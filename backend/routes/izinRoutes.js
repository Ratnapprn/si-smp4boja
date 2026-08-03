const express = require("express");
const pool = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const router = express.Router();

router.post("/", upload.single("bukti"), async (req, res) => {
  try {

    const {
      nama_siswa,
      kelas,
      nama_ortu,
      tanggal_tidak_masuk,
      jenis_izin,
      alasan
    } = req.body;

    // ==========================
    // Validasi upload bukti wajib
    // ==========================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Bukti izin wajib diunggah."
      });
    }

    // ==========================
    // Validasi tipe file
    // ==========================

    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf"
    ];

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "File harus berupa JPG, JPEG, PNG, atau PDF."
      });
    }

    const bukti = req.file.filename;

    // ==========================
    // Validasi data form
    // ==========================

    if (
      !nama_siswa ||
      !kelas ||
      !nama_ortu ||
      !tanggal_tidak_masuk ||
      !jenis_izin
    ) {
      return res.status(400).json({
        success: false,
        message: "Semua data wajib diisi."
      });
    }

    const result = await pool.query(
      `
      INSERT INTO izin_siswa
      (
        nama_siswa,
        kelas,
        nama_ortu,
        tanggal_tidak_masuk,
        jenis_izin,
        alasan,
        bukti,
        status
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,'Menunggu'
      )
      RETURNING *
      `,
      [
        nama_siswa,
        kelas,
        nama_ortu,
        tanggal_tidak_masuk,
        jenis_izin,
        alasan,
        bukti
      ]
    );

    res.status(201).json({
      success: true,
      message: "Izin siswa berhasil dikirim.",
      data: result.rows[0]
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengirim izin siswa."
    });

  }
});

router.get("/admin", verifyToken, async (req, res) => {
  try {

    const result = await pool.query(
      "SELECT * FROM izin_siswa ORDER BY created_at DESC,id DESC"
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil data izin siswa."
    });

  }
});

router.put("/:id/status", verifyToken, async (req, res) => {

  try {

    const { id } = req.params;
    const { status } = req.body;

    if (!status) {

      return res.status(400).json({
        success: false,
        message: "Status wajib diisi."
      });

    }

    const result = await pool.query(
      "UPDATE izin_siswa SET status=$1 WHERE id=$2 RETURNING *",
      [status, id]
    );

    if (result.rows.length === 0) {

      return res.status(404).json({
        success: false,
        message: "Data izin tidak ditemukan."
      });

    }

    res.json({
      success: true,
      message: "Status izin berhasil diperbarui.",
      data: result.rows[0]
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal memperbarui status izin."
    });

  }

});

router.delete("/:id", verifyToken, async (req, res) => {

  try {

    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM izin_siswa WHERE id=$1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {

      return res.status(404).json({
        success: false,
        message: "Data izin tidak ditemukan."
      });

    }

    res.json({
      success: true,
      message: "Data izin berhasil dihapus."
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal menghapus data izin."
    });

  }

});

module.exports = router;