const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    message: "Admin Routes Aktif",
  });
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username dan password wajib diisi",
      });
    }

    const result = await pool.query(
      "SELECT * FROM admins WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Username tidak ditemukan",
      });
    }

    const admin = result.rows[0];

    const passwordValid = await bcrypt.compare(password, admin.password);

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Password salah",
      });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        nama: admin.nama,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      message: "Login berhasil",
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        nama: admin.nama,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
});

router.get("/dashboard", verifyToken, (req, res) => {
  res.json({
    success: true,
    message: "Berhasil masuk dashboard admin",
    admin: req.admin,
  });
});

module.exports = router;