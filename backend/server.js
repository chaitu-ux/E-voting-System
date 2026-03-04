const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

require("dotenv").config({ path: "./.env" });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { ethers } = require("ethers");
const path = require("path");

/* =============================================================
   MODELS
============================================================= */
const Student = require("./models/Student");
const Election = require("./models/Election");

/* =============================================================
   ROUTES
============================================================= */
const voterRoutes = require("./routes/voterRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const candidateRoutes = require("./routes/candidateRoutes");

/* =============================================================
   APP INIT
============================================================= */
const app = express();
console.log("🚀 SERVER FILE LOADED");

/* =============================================================
   CORS — must be before everything else
============================================================= */
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

/* =============================================================
   HELMET — fixed to allow cross-origin images
============================================================= */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

/* =============================================================
   RATE LIMITING
============================================================= */

// Global — 500 requests per 15 min
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Auth limiter — 50 per 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: "Too many login attempts. Please wait.",
  },
});

// Vote limiter — 20 per 15 min
const voteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many voting attempts. Please wait.",
  },
});

/* =============================================================
   GENERAL MIDDLEWARE
============================================================= */
app.use(bodyParser.json());
app.use(express.json());

/* =============================================================
   STATIC FILE SERVING
============================================================= */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =============================================================
   MONGODB CONNECTION
============================================================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    console.log("📂 Connected DB:", mongoose.connection.name);
  })
  .catch((err) => console.error("❌ Mongo Error:", err));

/* =============================================================
   ROUTE MOUNTING
   ✅ FIX: Removed app.use("/api", authRoutes) — this was the
   cause of GET /api/voter/winner returning 404.
   Express matched "/api/voter/winner" against "/api" prefix first
   and authRoutes had no "/voter/winner" handler → 404.
   Now voter routes are mounted ONLY at /api/voter (correct).
   Auth routes are mounted ONLY at /api/auth (correct).
============================================================= */

// Admin routes
app.use("/api/admin", adminRoutes);

// Candidate routes
app.use("/api/candidates", candidateRoutes);

// Auth routes — ONLY at /api/auth
app.use("/api/auth", authLimiter, authRoutes);

// Voter routes — ONLY at /api/voter
app.use("/api/voter", voteLimiter, voterRoutes);

// ✅ REMOVED: app.use("/api", authRoutes)
// This line was intercepting ALL /api/* requests including
// /api/voter/winner and /api/voter/commit-vote → causing 404s

/* =============================================================
   PUBLIC REGISTRATION
   POST /api/register
   (Legacy endpoint — kept for backward compatibility)
============================================================= */
app.post("/api/register", async (req, res) => {
  try {
    const { studentId, name, email, department, year, password } = req.body;

    if (!studentId || !name || !email || !department || !year) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingStudent = await Student.findOne({
      $or: [{ studentId }, { email }],
    });

    if (existingStudent) {
      return res.status(400).json({
        message: "Student ID or email already registered",
      });
    }

    const studentHash = ethers.keccak256(ethers.toUtf8Bytes(studentId));
    const didSalt = process.env.DID_SALT || "evoting_did_salt_2024";
    const didHash = ethers.keccak256(
      ethers.toUtf8Bytes(`${studentId}:${didSalt}`)
    );
    const did = `did:university:${didHash}`;

    let hashedPassword = null;
    if (password) {
      const bcrypt = require("bcryptjs");
      hashedPassword = await bcrypt.hash(password, 12);
    }

    await Student.create({
      did,
      studentId,
      studentHash,
      didHash,
      name,
      email,
      department,
      year,
      password: hashedPassword,
      status: "pending",
      isEligible: false,
      isBlacklisted: false,
      isDIDRegistered: false,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful. Waiting for admin approval.",
    });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: error.message });
  }
});

/* =============================================================
   ELECTION STATUS
   GET /api/election-status
============================================================= */
app.get("/api/election-status", async (req, res) => {
  try {
    const activeElection = await Election.findOne({ status: "active" });
    if (!activeElection) return res.json({ isOpen: false });
    res.json({ isOpen: activeElection.isOpen });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =============================================================
   HEALTH CHECK
============================================================= */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    server: "University Blockchain E-Voting Backend",
    timestamp: new Date().toISOString(),
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

/* =============================================================
   DEFAULT ROUTE
============================================================= */
app.get("/", (req, res) => {
  res.send("University Blockchain E-Voting Backend Running");
});

/* =============================================================
   GLOBAL ERROR HANDLER
============================================================= */
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.message);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

/* =============================================================
   START SERVER
============================================================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || "development"}`);
});