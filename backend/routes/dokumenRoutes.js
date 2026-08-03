const express = require("express");
const pool = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const router = express.Router();

const SELECT_DOKUMEN = `
  SELECT id, nama_file AS nama_dokumen, kategori, keterangan, file_path AS file, created_at
  FROM dokumen
`;

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_DOKUMEN} ORDER BY id DESC`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("ERROR GET DOKUMEN:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil data dokumen." });
  }
});

router.get("/admin", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_DOKUMEN} ORDER BY id DESC`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("ERROR GET DOKUMEN ADMIN:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil data dokumen." });
  }
});

router.post("/", verifyToken, upload.single("file"), async (req, res) => {
  try {
    const nama_dokumen = typeof req.body.nama_dokumen === "string" ? req.body.nama_dokumen.trim() : "";
    const kategori = typeof req.body.kategori === "string" ? req.body.kategori.trim() : "";
    const keterangan = typeof req.body.keterangan === "string" ? req.body.keterangan.trim() : "";
    const file = req.file ? req.file.filename : null;

    if (!nama_dokumen || !kategori || !file) {
      return res.status(400).json({ success: false, message: "Nama dokumen, kategori, dan file wajib diisi." });
    }

    const result = await pool.query(`
      INSERT INTO dokumen (nama_file, kategori, keterangan, file_path)
      VALUES ($1,$2,$3,$4)
      RETURNING id, nama_file AS nama_dokumen, kategori, keterangan, file_path AS file, created_at
    `, [nama_dokumen, kategori, keterangan || null, file]);

    res.status(201).json({ success: true, message: "Dokumen berhasil diupload.", data: result.rows[0] });
  } catch (error) {
    console.error("ERROR TAMBAH DOKUMEN:", error);
    res.status(500).json({ success: false, message: "Gagal mengupload dokumen." });
  }
});

router.put("/:id", verifyToken, upload.single("file"), async (req, res) => {
  try {
    const nama_dokumen = typeof req.body.nama_dokumen === "string" ? req.body.nama_dokumen.trim() : "";
    const kategori = typeof req.body.kategori === "string" ? req.body.kategori.trim() : "";
    const keterangan = typeof req.body.keterangan === "string" ? req.body.keterangan.trim() : "";
    const oldData = await pool.query("SELECT * FROM dokumen WHERE id=$1", [req.params.id]);

    if (!oldData.rows.length) {
      return res.status(404).json({ success: false, message: "Dokumen tidak ditemukan." });
    }
    if (!nama_dokumen || !kategori) {
      return res.status(400).json({ success: false, message: "Nama dokumen dan kategori wajib diisi." });
    }

    const file = req.file ? req.file.filename : oldData.rows[0].file_path;
    const result = await pool.query(`
      UPDATE dokumen
      SET nama_file=$1, kategori=$2, keterangan=$3, file_path=$4
      WHERE id=$5
      RETURNING id, nama_file AS nama_dokumen, kategori, keterangan, file_path AS file, created_at
    `, [nama_dokumen, kategori, keterangan || null, file, req.params.id]);

    res.json({ success: true, message: "Dokumen berhasil diperbarui.", data: result.rows[0] });
  } catch (error) {
    console.error("ERROR EDIT DOKUMEN:", error);
    res.status(500).json({ success: false, message: "Gagal memperbarui dokumen." });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM dokumen WHERE id=$1 RETURNING id", [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: "Dokumen tidak ditemukan." });
    res.json({ success: true, message: "Dokumen berhasil dihapus." });
  } catch (error) {
    console.error("ERROR HAPUS DOKUMEN:", error);
    res.status(500).json({ success: false, message: "Gagal menghapus dokumen." });
  }
});

module.exports = router;
