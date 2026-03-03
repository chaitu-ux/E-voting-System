const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  did: {
    type: String,
    unique: true,
  },

  studentId: {
    type: String,
    required: true,
    unique: true, // 🔥 prevent duplicate student IDs
  },

  studentHash: {
    type: String,
    unique: true,
    required: true,
  },

  name: {
    type: String,
    required: true, // 🔥 required for registration
  },

  email: {
    type: String,
    required: true,
    unique: true, // 🔥 prevent duplicate emails
  },

  department: {
    type: String,
    required: true,
  },

  year: {
    type: String,
    required: true,
  },

  /* =========================
     🟡 Approval System
  ========================= */

  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "blacklisted"],
    default: "pending",
  },

  isEligible: {
    type: Boolean,
    default: false,
  },

  isBlacklisted: {
    type: Boolean,
    default: false,
  },

  /* =========================
     🔐 OTP
  ========================= */

  otp: String,
  otpExpiry: Date,

  isOtpVerified: {
    type: Boolean,
    default: false,
  },

  /* =========================
     🚨 Fraud
  ========================= */

  failedAttempts: {
    type: Number,
    default: 0,
  },

  riskScore: {
    type: Number,
    default: 0,
  },

  lastAttemptTime: Date, // 🔥 needed for rapid detection

}, {
  timestamps: true // 🔥 better than manual createdAt
});

module.exports = mongoose.model("Student", studentSchema);