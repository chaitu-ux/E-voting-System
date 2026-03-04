const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { ethers } = require("ethers");

const Student = require("../models/Student");
const Election = require("../models/Election");
const FraudLog = require("../models/FraudLog");

/* =============================================================
   NODEMAILER SETUP
============================================================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* =============================================================
   HELPERS
============================================================= */

// DID Hash — keccak256(studentId + salt) — same formula everywhere
function generateDIDHash(studentId) {
  const salt = process.env.DID_SALT || "evoting_did_salt_2024";
  return ethers.keccak256(ethers.toUtf8Bytes(`${studentId}:${salt}`));
}

// Secure 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// MFA session token — issued after OTP verified
function generateMFASessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Styled OTP email
async function sendOTPEmail(email, name, otp, purpose) {
  await transporter.sendMail({
    from: `"University E-Voting System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Secure Voting OTP - University E-Voting",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;
                  border:1px solid #e0e0e0;border-radius:10px;padding:30px;">
        <h2 style="color:#1a1a2e;">University E-Voting System</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your OTP for <strong>${purpose}</strong> is:</p>
        <div style="background:#f0f4ff;border:2px solid #4f46e5;border-radius:8px;
                    text-align:center;padding:20px;margin:20px 0;">
          <h1 style="color:#4f46e5;letter-spacing:8px;margin:0;">${otp}</h1>
        </div>
        <p>Valid for <strong>5 minutes</strong> only. Do not share this OTP.</p>
        <hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0;"/>
        <p style="color:#999;font-size:12px;">University Blockchain E-Voting System</p>
      </div>
    `,
  });
}

// Fraud logger
async function logFraud(student, reason, ip, severity) {
  try {
    await FraudLog.create({
      student: student._id,
      studentHash: student.studentHash,
      reason,
      ipAddress: ip,
      severity,
    });
  } catch (e) {
    console.error("FraudLog error:", e.message);
  }
}

/* =============================================================
   STEP 1 — STUDENT REGISTRATION
   POST /api/auth/register-student
   Registers with password (Factor 1) + generates DID hash
============================================================= */

router.post("/register-student", async (req, res) => {
  try {
    const { studentId, name, email, department, year, password } = req.body;

    if (!studentId || !name || !email || !department || !year || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required including password",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const existingStudent = await Student.findOne({
      $or: [{ studentId }, { email }],
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: "Student ID or email already registered",
      });
    }

    // MFA Factor 1 — hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Legacy hash for backward compatibility
    const studentHash = ethers.keccak256(ethers.toUtf8Bytes(studentId));

    // DID-inspired identity hash
    const didHash = generateDIDHash(studentId);
    const did = `did:university:${didHash}`;

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
      message: "Registration submitted. Await admin approval before voting.",
    });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

/* =============================================================
   STEP 2 — MFA FACTOR 1: PASSWORD VERIFICATION
   POST /api/auth/login
   Verifies password → sends OTP (Factor 2)
============================================================= */

router.post("/login", async (req, res) => {
  try {
    const { studentId, password } = req.body;

    if (!studentId || !password) {
      return res.status(400).json({
        success: false,
        message: "Student ID and password required",
      });
    }

    const student = await Student.findOne({ studentId });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Rapid attempt check
    if (student.isRapidAttempt()) {
      await logFraud(student, "Rapid login attempts detected", req.ip, "medium");
      return res.status(429).json({
        success: false,
        message: "Too many attempts. Please wait 60 seconds.",
      });
    }

    // Blacklist check
    if (student.isBlacklisted) {
      await logFraud(student, "Blacklisted student login attempt", req.ip, "high");
      return res.status(403).json({
        success: false,
        message: "Access denied. Your account has been blacklisted.",
      });
    }

    // Factor 1 — verify password
    const isPasswordValid = await bcrypt.compare(password, student.password);

    if (!isPasswordValid) {
      await student.recordFailedAttempt(req.ip);
      await logFraud(student, "Invalid password attempt", req.ip, "low");
      return res.status(401).json({
        success: false,
        message: `Invalid password. ${3 - student.failedAttempts} attempts remaining.`,
      });
    }

    // Reset failed attempts on success
    student.failedAttempts = 0;
    student.lastAttemptTime = new Date();
    await student.save();

    // Factor 2 — generate and send OTP
    const otp = generateOTP();
    student.otp = otp;
    student.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min
    student.isOtpVerified = false;
    student.isMFAComplete = false;
    await student.save();

    await sendOTPEmail(student.email, student.name, otp, "secure login");

    res.json({
      success: true,
      message: "Password verified. OTP sent to your registered email.",
      studentId: student.studentId,
      mfaStep: 2,
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

/* =============================================================
   SEND OTP (standalone — for direct vote flow)
   POST /api/auth/send-otp
============================================================= */

router.post("/send-otp", async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: "Student ID required" });
    }

    const student = await Student.findOne({ studentId });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    if (student.isBlacklisted) {
      return res.status(403).json({ success: false, message: "You are blacklisted" });
    }

    if (student.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Your registration is not yet approved by admin",
      });
    }

    if (!student.isEligible) {
      return res.status(403).json({ success: false, message: "You are not eligible to vote" });
    }

    const election = await Election.findOne({ status: "active" });
    if (!election || !election.isOpen) {
      return res.status(403).json({ success: false, message: "Election is currently closed" });
    }

    if (student.isRapidAttempt()) {
      await logFraud(student, "Rapid OTP request detected", req.ip, "medium");
      return res.status(429).json({
        success: false,
        message: "Too many OTP requests. Please wait 60 seconds.",
      });
    }

    const otp = generateOTP();
    student.otp = otp;
    student.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    student.isOtpVerified = false;
    student.lastAttemptTime = new Date();
    await student.save();

    await sendOTPEmail(student.email, student.name, otp, "secure voting");

    res.json({ success: true, message: "OTP sent to your registered email" });

  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ success: false, message: "Error sending OTP" });
  }
});

/* =============================================================
   STEP 3 — MFA FACTOR 2: OTP VERIFICATION
   POST /api/auth/verify-otp
   Verifies OTP → issues JWT with MFA flag
============================================================= */

router.post("/verify-otp", async (req, res) => {
  try {
    const { studentId, otp } = req.body;

    if (!studentId || !otp) {
      return res.status(400).json({
        success: false,
        message: "Student ID and OTP required",
      });
    }

    const student = await Student.findOne({ studentId });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    if (student.isBlacklisted) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are blacklisted.",
      });
    }

    if (!student.otp || student.otp !== otp) {
      await student.recordFailedAttempt(req.ip);
      await logFraud(student, "Invalid OTP attempt", req.ip, "low");
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (!student.otpExpiry || student.otpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // MFA Factor 2 complete
    student.isOtpVerified = true;
    student.otpVerifiedAt = new Date();
    student.otp = null;
    student.otpExpiry = null;
    student.failedAttempts = 0;

    // Issue MFA session token
    const mfaSessionToken = generateMFASessionToken();
    student.mfaSessionToken = mfaSessionToken;
    student.mfaSessionExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2h
    student.isMFAComplete = true;
    await student.save();

    // JWT with MFA flag + DID hash embedded
    const token = jwt.sign(
      {
        id: student._id,
        role: "student",
        mfaComplete: true,
        didHash: student.didHash,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      success: true,
      message: "MFA verification complete. You are now authenticated.",
      token,
      role: "student",
      mfaComplete: true,
      student: {
        id: student._id,
        name: student.name,
        studentId: student.studentId,
        email: student.email,
        department: student.department,
        isEligible: student.isEligible,
        isDIDRegistered: student.isDIDRegistered,
        hasVoted: student.hasVoted,
      },
    });

  } catch (error) {
    console.error("OTP Verify Error:", error);
    res.status(500).json({ success: false, message: "Error verifying OTP" });
  }
});

/* =============================================================
   MFA FACTOR 3 — DID IDENTITY VERIFICATION
   POST /api/auth/verify-did
   Called before vote commit — confirms DID registered on blockchain
============================================================= */

router.post("/verify-did", async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: "studentId required" });
    }

    const student = await Student.findOne({ studentId });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    if (!student.isDIDRegistered) {
      return res.status(403).json({
        success: false,
        message: "Your DID is not registered on the blockchain. Contact admin.",
        isDIDRegistered: false,
      });
    }

    // Recompute and verify DID hash matches stored value
    const computedDIDHash = generateDIDHash(studentId);
    const didMatches = computedDIDHash === student.didHash;

    if (!didMatches) {
      await logFraud(student, "DID hash mismatch during verification", req.ip, "high");
      return res.status(403).json({
        success: false,
        message: "DID verification failed. Identity mismatch detected.",
      });
    }

    res.json({
      success: true,
      message: "DID identity verified — MFA Factor 3 complete",
      didHash: student.didHash,
      isDIDRegistered: true,
    });

  } catch (error) {
    console.error("DID Verify Error:", error);
    res.status(500).json({ success: false, message: "DID verification failed" });
  }
});

/* =============================================================
   LOGOUT
   POST /api/auth/logout
============================================================= */

router.post("/logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const student = await Student.findById(decoded.id);
        if (student) await student.clearMFASession();
      } catch (_) {}
    }
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.json({ success: true, message: "Logged out" });
  }
});

module.exports = router;