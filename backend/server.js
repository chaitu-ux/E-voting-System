const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

require("dotenv").config({ path: "./.env" });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { ethers } = require("ethers");
const path = require("path"); // ✅ ADDED

/* =========================
   Models
========================= */
const Student = require("./models/Student");
const Election = require("./models/Election");

/* =========================
   Routes
========================= */
const voterRoutes = require("./routes/voterRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const candidateRoutes = require("./routes/candidateRoutes");

/* =========================
   App Init
========================= */
const app = express();

console.log("🚀 SERVER FILE LOADED");

/* =========================
   Middleware
========================= */
app.use(cors());
app.use(bodyParser.json());

/* =====================================================
   ✅ STATIC UPLOADS FIX (VERY IMPORTANT)
===================================================== */
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

/* =========================
   MongoDB Connection
========================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    console.log("📂 Connected DB:", mongoose.connection.name);
  })
  .catch(err => console.error("❌ Mongo Error:", err));

/* =========================
   Route Mounting
========================= */

app.use("/api/admin", adminRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api", voterRoutes);
app.use("/api", authRoutes);

/* =========================
   Public Student Registration
========================= */
app.post("/api/register", async (req, res) => {
  try {
    const { studentId, name, email, department, year } = req.body;

    if (!studentId || !name || !email || !department || !year) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const studentHash = ethers.keccak256(
      ethers.toUtf8Bytes(studentId)
    );

    const existingId = await Student.findOne({ studentId });
    if (existingId) {
      return res.status(400).json({
        message: "Student ID already registered",
      });
    }

    const existingEmail = await Student.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    const did = `did:university:${studentHash}`;

    await Student.create({
      did,
      studentId,
      studentHash,
      name,
      email,
      department,
      year,
      status: "pending",
      isEligible: false,
      isBlacklisted: false,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful. Waiting for admin approval.",
    });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({
      message: error.message,
    });
  }
});

/* =========================
   Election Status API
========================= */
app.get("/api/election-status", async (req, res) => {
  try {
    const activeElection = await Election.findOne({ status: "active" });

    if (!activeElection) {
      return res.json({ isOpen: false });
    }

    res.json({ isOpen: activeElection.isOpen });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =========================
   Default Route
========================= */
app.get("/", (req, res) => {
  res.send("University Blockchain E-Voting Backend Running");
});

/* =========================
   Start Server
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});