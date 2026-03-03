const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { ethers } = require("ethers");

const Student = require("../models/Student");
const Election = require("../models/Election");

/* =========================
   Nodemailer Setup
========================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* =====================================================
   🎓 STUDENT REGISTRATION
===================================================== */
router.post("/register-student", async (req, res) => {
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

    const existingStudent = await Student.findOne({
      $or: [{ studentId }, { email }],
    });

    if (existingStudent) {
      return res.status(400).json({
        message: "Student already registered",
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
      message: "Registration submitted. Wait for admin approval.",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Registration failed",
    });
  }
});

/* =====================================================
   📧 SEND OTP
===================================================== */
router.post("/send-otp", async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID required" });
    }

    const studentHash = ethers.keccak256(
      ethers.toUtf8Bytes(studentId)
    );

    const student = await Student.findOne({ studentHash });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    /* =========================
       🛑 Election Status Check
    ========================= */
    const election = await Election.findOne({ status: "active" });

    if (!election || !election.isOpen) {
      return res.status(403).json({
        message: "Election is currently closed",
      });
    }

    if (student.status !== "approved") {
      return res.status(403).json({
        message: "Your registration is not approved by admin yet",
      });
    }

    if (!student.isEligible) {
      return res.status(403).json({
        message: "You are not eligible to vote",
      });
    }

    if (student.isBlacklisted) {
      return res.status(403).json({
        message: "You are blacklisted due to suspicious activity",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    student.otp = otp;
    student.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    student.isOtpVerified = false;

    await student.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: student.email,
      subject: "University E-Voting OTP Verification",
      text: `Your OTP for secure voting is: ${otp}. It is valid for 5 minutes.`,
    });

    res.json({ message: "OTP sent to registered email" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending OTP" });
  }
});

/* =====================================================
   🔐 VERIFY OTP + LOGIN
===================================================== */
router.post("/verify-otp", async (req, res) => {
  try {
    const { studentId, otp } = req.body;

    if (!studentId || !otp) {
      return res.status(400).json({
        message: "Student ID and OTP required",
      });
    }

    const studentHash = ethers.keccak256(
      ethers.toUtf8Bytes(studentId)
    );

    const student = await Student.findOne({ studentHash });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (student.isBlacklisted) {
      return res.status(403).json({
        message: "Access denied. You are blacklisted.",
      });
    }

    if (student.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (!student.otpExpiry || student.otpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    /* =========================
       ✅ Mark Verified
    ========================= */
    student.isOtpVerified = true;
    student.otp = null;
    student.otpExpiry = null;

    await student.save();

    /* =========================
       🔥 Generate JWT Token
    ========================= */
    const token = jwt.sign(
      {
        id: student._id,
        role: "student", // 🔥 required for multi-role middleware
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "OTP verified successfully",
      token,
      role: "student",
      student: {
        id: student._id,
        name: student.name,
        studentId: student.studentId,
        email: student.email,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error verifying OTP" });
  }
});

module.exports = router;