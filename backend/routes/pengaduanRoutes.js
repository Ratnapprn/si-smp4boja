const express = require("express");
const pool = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const router = express.Router();

router.post("/", upload.single("bukti"), async (req, res) => {
  try {
    const {
      nama_pelapor,
      nama_siswa,
      kelas,
      topik_pengaduan,
      kontak,
      isi_pengaduan
    } = req.body;

    // ==========================
    // VALIDASI BUKTI WAJIB
    // ==========================
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Bukti pengaduan wajib diupload."
      });
    }

    const bukti = req.file.filename;

    if (
      !nama_pelapor ||
      !topik_pengaduan ||
      !kontak ||
      !isi_pengaduan
    ) {
      return res.status(400).json({
        success: false,
        message: "Data wajib belum lengkap."
      });
    }

    const result = await pool.query(
      `INSERT INTO pengaduan
      (
        nama_pelapor,
        nama_siswa,
        kelas,
        topik_pengaduan,
        kontak,
        isi_pengaduan,
        bukti,
        status
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,'Menunggu'
      )
      RETURNING *`,
      [
        nama_pelapor,
        nama_siswa,
        kelas,
        topik_pengaduan,
        kontak,
        isi_pengaduan,
        bukti
      ]
    );

    res.status(201).json({
      success: true,
      message: "Pengaduan berhasil dikirim.",
      data: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengirim pengaduan."
    });
  }
});

router.get("/admin", verifyToken, async (req, res) => {
  try {

    const result = await pool.query(
      "SELECT * FROM pengaduan ORDER BY created_at DESC, id DESC"
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil data pengaduan."
    });
  }
});

router.put("/:id/status", verifyToken, async (req, res) => {
  try {

    const { id } = req.params;
    const { status } = req.body;
    const normalizedStatus = String(status || "").trim();

    if (!normalizedStatus) {
      return res.status(400).json({
        success: false,
        message: "Status wajib diisi."
      });
    }

    const finalStatus = normalizedStatus.toLowerCase() === "memproses" || normalizedStatus.toLowerCase() === "proses"
      ? "Diproses"
      : normalizedStatus;

    const result = await pool.query(
      "UPDATE pengaduan SET status=$1 WHERE id=$2 RETURNING *",
      [finalStatus, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data pengaduan tidak ditemukan."
      });
    }

    res.json({
      success: true,
      message: "Status pengaduan berhasil diperbarui.",
      data: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal memperbarui status pengaduan."
    });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {

    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM pengaduan WHERE id=$1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data pengaduan tidak ditemukan."
      });
    }

    res.json({
      success: true,
      message: "Data pengaduan berhasil dihapus."
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal menghapus data pengaduan."
    });
  }
});

module.exports = router;