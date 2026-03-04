const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({

  // ─────────────────────────────────────────
  // CORE IDENTITY
  // ─────────────────────────────────────────

  studentId: {
    type: String,
    required: true,
    unique: true,
    // ✅ REMOVED: studentSchema.index({ studentId: 1 }) below — no duplicate
  },

  studentHash: {
    type: String,
    unique: true,
    required: true,
  },

  // ─────────────────────────────────────────
  // DID-INSPIRED IDENTITY
  // ─────────────────────────────────────────

  did: {
    type: String,
    unique: true,
    sparse: true,
  },

  didHash: {
    type: String,
    unique: true,
    sparse: true,
    // ✅ REMOVED: studentSchema.index({ didHash: 1 }) below — no duplicate
  },

  didRegisteredAt: {
    type: Date,
    default: null,
  },

  isDIDRegistered: {
    type: Boolean,
    default: false,
  },

  blockchainCandidateId: {
    type: Number,
    default: null,
  },

  // ─────────────────────────────────────────
  // PERSONAL INFO
  // ─────────────────────────────────────────

  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    // ✅ REMOVED: studentSchema.index({ email: 1 }) below — no duplicate
  },

  department: {
    type: String,
    required: true,
  },

  year: {
    type: String,
    required: true,
  },

  // ─────────────────────────────────────────
  // APPROVAL SYSTEM
  // ─────────────────────────────────────────

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

  // ─────────────────────────────────────────
  // MFA — MULTI-FACTOR AUTHENTICATION
  // ─────────────────────────────────────────

  password: {
    type: String,
    default: null,
  },

  otp: String,
  otpExpiry: Date,

  isOtpVerified: {
    type: Boolean,
    default: false,
  },

  otpVerifiedAt: {
    type: Date,
    default: null,
  },

  mfaSessionToken: {
    type: String,
    default: null,
  },

  mfaSessionExpiry: {
    type: Date,
    default: null,
  },

  isMFAComplete: {
    type: Boolean,
    default: false,
  },

  // ─────────────────────────────────────────
  // E2E VOTE VERIFICATION
  // ─────────────────────────────────────────

  hasVoted: {
    type: Boolean,
    default: false,
  },

  votedAt: {
    type: Date,
    default: null,
  },

  voteVerificationCode: {
    type: String,
    default: null,
  },

  voteVerifiedAt: {
    type: Date,
    default: null,
  },

  // ─────────────────────────────────────────
  // FRAUD DETECTION
  // ─────────────────────────────────────────

  failedAttempts: {
    type: Number,
    default: 0,
  },

  riskScore: {
    type: Number,
    default: 0,
  },

  lastAttemptTime: {
    type: Date,
    default: null,
  },

  suspiciousIPs: {
    type: [String],
    default: [],
  },

  fraudReportedToChain: {
    type: Boolean,
    default: false,
  },

}, {
  timestamps: true,
});

/* =============================================================
   INDEXES
   ✅ FIXED — only index fields that do NOT already have unique:true
   Fields with unique:true already create an index automatically
   Duplicating them causes the mongoose warning
============================================================= */

// ✅ These are safe — NOT declared as unique:true in schema above
studentSchema.index({ status: 1 });
studentSchema.index({ riskScore: -1 });
studentSchema.index({ isBlacklisted: 1 });

// ❌ REMOVED these 3 — they duplicate unique:true fields above:
// studentSchema.index({ email: 1 });      — already unique:true
// studentSchema.index({ studentId: 1 });  — already unique:true
// studentSchema.index({ didHash: 1 });    — already unique:true

/* =============================================================
   VIRTUALS
============================================================= */
studentSchema.virtual("isFullyVerified").get(function () {
  return this.isDIDRegistered && this.isEligible && this.isOtpVerified;
});

studentSchema.virtual("isMFASessionValid").get(function () {
  if (!this.mfaSessionExpiry) return false;
  return new Date() < new Date(this.mfaSessionExpiry);
});

/* =============================================================
   METHODS
============================================================= */
studentSchema.methods.isRapidAttempt = function () {
  if (!this.lastAttemptTime) return false;
  const now = Date.now();
  const last = new Date(this.lastAttemptTime).getTime();
  return now - last < 60 * 1000;
};

studentSchema.methods.recordFailedAttempt = async function (ip) {
  this.failedAttempts += 1;
  this.riskScore += 10;
  this.lastAttemptTime = new Date();

  if (ip && !this.suspiciousIPs.includes(ip)) {
    this.suspiciousIPs.push(ip);
  }

  if (this.failedAttempts >= 3) {
    this.isBlacklisted = true;
    this.status = "blacklisted";
  }

  await this.save();
};

studentSchema.methods.clearMFASession = async function () {
  this.mfaSessionToken = null;
  this.mfaSessionExpiry = null;
  this.isMFAComplete = false;
  await this.save();
};

module.exports =
  mongoose.models.Student || mongoose.model("Student", studentSchema);