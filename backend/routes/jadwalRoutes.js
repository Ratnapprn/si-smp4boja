const express = require("express");
const pool = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");
const JADWAL_AWAL = require("../data/jadwalAwal");
const uploadExcel = require("../middleware/uploadExcel");
const XLSX = require("xlsx");

const router = express.Router();

const KELAS_VALID = ["VII", "VIII", "IX"];
const JENIS_VALID = ["Pelajaran", "Ekstrakurikuler"];
const HARI_VALID = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

const SELECT_JADWAL = `
  SELECT id, periode, jenis, hari,
         TO_CHAR(jam_mulai, 'HH24:MI') AS jam_mulai,
         TO_CHAR(jam_selesai, 'HH24:MI') AS jam_selesai,
         kelas, mata_pelajaran, guru, keterangan
  FROM jadwal
`;

const ORDER_JADWAL = `
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
    CASE WHEN jenis = 'Ekstrakurikuler' THEN 1 ELSE 0 END,
    jam_mulai NULLS LAST,
    CASE kelas
      WHEN 'VII' THEN 1
      WHEN 'VIII' THEN 2
      WHEN 'IX' THEN 3
      WHEN 'Semua Kelas' THEN 4
      ELSE 5
    END,
    LOWER(mata_pelajaran),
    id
`;

function validateJadwal(body) {
  const jenis = String(body.jenis || "").trim();
  const hari = String(body.hari || "").trim();
  const mata_pelajaran = String(body.mata_pelajaran || "").trim();
  const keterangan = String(body.keterangan || "").trim();

  if (!JENIS_VALID.includes(jenis)) {
    return { error: "Jenis jadwal tidak valid." };
  }

  if (!HARI_VALID.includes(hari)) {
    return { error: "Hari jadwal tidak valid." };
  }

  if (!mata_pelajaran) {
    return { error: "Nama mata pelajaran atau kegiatan wajib diisi." };
  }

  // Ekstrakurikuler sesuai kebutuhan sekolah: hanya nama kegiatan + hari.
  if (jenis === "Ekstrakurikuler") {
    return {
      data: {
        periode: null,
        jenis,
        hari,
        jam_mulai: null,
        jam_selesai: null,
        kelas: "Semua Kelas",
        mata_pelajaran,
        guru: null,
        keterangan: keterangan || null
      }
    };
  }

  const periode = String(body.periode || "").trim();
  const kelas = String(body.kelas || "").trim();
  const jam_mulai = String(body.jam_mulai || "").trim();
  const jam_selesai = String(body.jam_selesai || "").trim();
  const guru = String(body.guru || "").trim();

  if (!periode || !kelas || !jam_mulai || !jam_selesai) {
    return { error: "Untuk jadwal pelajaran, periode, kelas, jam mulai, dan jam selesai wajib diisi." };
  }

  if (!KELAS_VALID.includes(kelas)) {
    return { error: "Kelas hanya dapat berupa VII, VIII, atau IX." };
  }

  if (jam_mulai >= jam_selesai) {
    return { error: "Jam selesai harus lebih besar dari jam mulai." };
  }

  return {
    data: {
      periode,
      jenis,
      hari,
      jam_mulai,
      jam_selesai,
      kelas,
      mata_pelajaran,
      guru: guru || null,
      keterangan: keterangan || null
    }
  };
}

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_JADWAL}${ORDER_JADWAL}`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("GET /api/jadwal:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil data jadwal." });
  }
});

router.get("/admin", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_JADWAL}${ORDER_JADWAL}`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("GET /api/jadwal/admin:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil data jadwal." });
  }
});

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_JADWAL} WHERE id = $1`, [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Data jadwal tidak ditemukan." });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("GET /api/jadwal/:id:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil data jadwal." });
  }
});

router.post("/import", verifyToken, uploadExcel.single("file"), async (req, res) => {
  const client = await pool.connect();
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Silakan pilih file Excel jadwal pelajaran." });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer", cellDates: false });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(400).json({ success: false, message: "File Excel tidak memiliki sheet." });
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
    if (!rows.length) {
      return res.status(400).json({ success: false, message: "File Excel tidak memiliki data jadwal." });
    }

    const get = (row, keys) => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
          return String(row[key]).trim();
        }
      }
      return "";
    };

    const normalized = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const jenis = get(row, ["jenis", "Jenis"]) || "Pelajaran";
      if (jenis !== "Pelajaran") continue;

      const periode = get(row, ["periode", "Periode", "Tahun Pelajaran"]);
      const hari = get(row, ["hari", "Hari"]);
      const jam_mulai = get(row, ["jam_mulai", "Jam Mulai", "jam mulai"]);
      const jam_selesai = get(row, ["jam_selesai", "Jam Selesai", "jam selesai"]);
      const kelas = get(row, ["kelas", "Kelas"]);
      const mata_pelajaran = get(row, ["mata_pelajaran", "Mata Pelajaran", "Mata Pelajaran / Kegiatan", "Mapel"]);
      const guru = get(row, ["guru", "Guru", "Guru / Pembina"]);
      const keterangan = get(row, ["keterangan", "Keterangan"]);

      if (!periode || !hari || !jam_mulai || !jam_selesai || !kelas || !mata_pelajaran) {
        throw new Error(`Baris Excel ke-${i + 2} belum lengkap. Wajib ada periode, hari, jam mulai, jam selesai, kelas, dan mata pelajaran.`);
      }
      if (!KELAS_VALID.includes(kelas)) {
        throw new Error(`Baris Excel ke-${i + 2}: kelas "${kelas}" tidak valid. Gunakan VII, VIII, atau IX.`);
      }
      if (!HARI_VALID.includes(hari)) {
        throw new Error(`Baris Excel ke-${i + 2}: hari "${hari}" tidak valid.`);
      }
      if (jam_mulai >= jam_selesai) {
        throw new Error(`Baris Excel ke-${i + 2}: jam selesai harus lebih besar dari jam mulai.`);
      }

      normalized.push({ periode, jenis: "Pelajaran", hari, jam_mulai, jam_selesai, kelas, mata_pelajaran, guru: guru || null, keterangan: keterangan || null });
    }

    if (!normalized.length) {
      return res.status(400).json({ success: false, message: "Tidak ada baris jadwal pelajaran yang dapat diimpor." });
    }

    await client.query("BEGIN");
    // Hanya mengganti jadwal PELAJARAN. Jadwal Ekstrakurikuler tetap aman.
    await client.query("DELETE FROM jadwal WHERE jenis = 'Pelajaran'");

    for (const d of normalized) {
      await client.query(`
        INSERT INTO jadwal
          (periode, jenis, hari, jam_mulai, jam_selesai, kelas, mata_pelajaran, guru, keterangan)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `, [d.periode, d.jenis, d.hari, d.jam_mulai, d.jam_selesai, d.kelas, d.mata_pelajaran, d.guru, d.keterangan]);
    }

    await client.query("COMMIT");
    res.json({ success: true, message: `${normalized.length} jadwal pelajaran berhasil diimpor. Jadwal ekstrakurikuler tidak diubah.` });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("POST /api/jadwal/import:", error);
    res.status(500).json({ success: false, message: error.message || "Gagal mengimpor jadwal." });
  } finally {
    client.release();
  }
});

router.post("/seed-default", verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM jadwal WHERE jenis = 'Pelajaran'");

    for (const d of JADWAL_AWAL) {
      await client.query(`
        INSERT INTO jadwal
          (periode, jenis, hari, jam_mulai, jam_selesai, kelas, mata_pelajaran, guru, keterangan)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `, [d.periode, d.jenis, d.hari, d.jam_mulai, d.jam_selesai, d.kelas, d.mata_pelajaran, d.guru, d.keterangan]);
    }

    await client.query("COMMIT");
    res.json({ success: true, message: `${JADWAL_AWAL.length} jadwal awal berhasil dimasukkan.` });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("POST /api/jadwal/seed-default:", error);
    res.status(500).json({ success: false, message: error.message || "Gagal memasukkan jadwal awal." });
  } finally {
    client.release();
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const validation = validateJadwal(req.body);
    if (validation.error) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    const d = validation.data;
    const result = await pool.query(`
      INSERT INTO jadwal
        (periode, jenis, hari, jam_mulai, jam_selesai, kelas, mata_pelajaran, guru, keterangan)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id, periode, jenis, hari,
                TO_CHAR(jam_mulai, 'HH24:MI') AS jam_mulai,
                TO_CHAR(jam_selesai, 'HH24:MI') AS jam_selesai,
                kelas, mata_pelajaran, guru, keterangan
    `, [d.periode, d.jenis, d.hari, d.jam_mulai, d.jam_selesai, d.kelas, d.mata_pelajaran, d.guru, d.keterangan]);

    res.status(201).json({
      success: true,
      message: "Jadwal berhasil ditambahkan.",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("POST /api/jadwal:", error);
    res.status(500).json({ success: false, message: error.message || "Gagal menambahkan jadwal." });
  }
});

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const validation = validateJadwal(req.body);
    if (validation.error) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    const d = validation.data;
    const result = await pool.query(`
      UPDATE jadwal
      SET periode=$1,
          jenis=$2,
          hari=$3,
          jam_mulai=$4,
          jam_selesai=$5,
          kelas=$6,
          mata_pelajaran=$7,
          guru=$8,
          keterangan=$9,
          updated_at=CURRENT_TIMESTAMP
      WHERE id=$10
      RETURNING id, periode, jenis, hari,
                TO_CHAR(jam_mulai, 'HH24:MI') AS jam_mulai,
                TO_CHAR(jam_selesai, 'HH24:MI') AS jam_selesai,
                kelas, mata_pelajaran, guru, keterangan
    `, [d.periode, d.jenis, d.hari, d.jam_mulai, d.jam_selesai, d.kelas, d.mata_pelajaran, d.guru, d.keterangan, req.params.id]);

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Data jadwal tidak ditemukan." });
    }

    res.json({
      success: true,
      message: "Jadwal berhasil diperbarui.",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("PUT /api/jadwal/:id:", error);
    res.status(500).json({ success: false, message: error.message || "Gagal memperbarui jadwal." });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM jadwal WHERE id=$1 RETURNING id",
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Data jadwal tidak ditemukan." });
    }

    res.json({ success: true, message: "Jadwal berhasil dihapus." });
  } catch (error) {
    console.error("DELETE /api/jadwal/:id:", error);
    res.status(500).json({ success: false, message: "Gagal menghapus jadwal." });
  }
});

module.exports = router;
