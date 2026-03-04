const mongoose = require("mongoose");

const voterSchema = new mongoose.Schema({

  // ─────────────────────────────────────────
  // CORE REFERENCES
  // ─────────────────────────────────────────

  election: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Election",
    required: true,
  },

  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },

  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate",
    required: true,
  },

  // ─────────────────────────────────────────
  // DID-INSPIRED IDENTITY
  // keccak256(studentId + secret salt)
  // No personal data stored on-chain
  // ─────────────────────────────────────────

  studentHash: {
    type: String,
    required: true,
  },

  didHash: {
    type: String,
    required: true,
    comment: "DID identity hash registered on blockchain"
  },

  // Blockchain candidate ID (uint used in smart contract)
  blockchainCandidateId: {
    type: Number,
    required: true,
  },

  // ─────────────────────────────────────────
  // ZKP COMMIT → REVEAL PHASE TRACKING
  // Phase 1: commit  |  Phase 2: revealed
  // ─────────────────────────────────────────

  phase: {
    type: String,
    enum: ["committed", "revealed"],
    default: "committed",
    required: true,
  },

  // keccak256(didHash + candidateId + nonce) — submitted in Phase 1
  commitmentHash: {
    type: String,
    default: null,
  },

  // Random nonce used to compute commitment — cleared after reveal
  nonce: {
    type: String,
    default: null,
    comment: "Cleared after reveal phase for security"
  },

  // Transaction hash from Phase 1 (commit)
  commitTransactionHash: {
    type: String,
    default: null,
  },

  // Transaction hash from Phase 2 (reveal) — final vote tx
  revealTransactionHash: {
    type: String,
    default: null,
  },

  // Keep old field for backward compatibility
  transactionHash: {
    type: String,
    default: null,
  },

  // ─────────────────────────────────────────
  // E2E VERIFIABLE VOTING
  // Unique code issued by blockchain after vote
  // Voter uses this to independently verify
  // ─────────────────────────────────────────

  verificationCode: {
    type: String,
    default: null,
    comment: "E2E receipt code from blockchain VoteReceiptIssued event"
  },

  verificationCheckedAt: {
    type: Date,
    default: null,
    comment: "Timestamp of last voter self-verification"
  },

  // ─────────────────────────────────────────
  // LAYER-2 / OFF-CHAIN ANCHORING
  // Hash of off-chain data anchored to blockchain
  // ─────────────────────────────────────────

  offChainDataRoot: {
    type: String,
    default: null,
    comment: "Merkle-root style hash anchored on blockchain for data integrity"
  },

  anchorTransactionHash: {
    type: String,
    default: null,
  },

  // ─────────────────────────────────────────
  // TIMESTAMPS
  // ─────────────────────────────────────────

  committedAt: {
    type: Date,
    default: null,
  },

  revealedAt: {
    type: Date,
    default: null,
  },

  votedAt: {
    type: Date,
    default: Date.now,
  },

});

// ─────────────────────────────────────────
// INDEXES
// ─────────────────────────────────────────

// Prevent double voting in same election
voterSchema.index(
  { election: 1, student: 1 },
  { unique: true }
);

// Fast lookup by verification code (E2E verification)
voterSchema.index({ verificationCode: 1 });

// Fast lookup by DID hash
voterSchema.index({ didHash: 1 });

// Fast lookup by phase (find all committed-but-not-revealed)
voterSchema.index({ phase: 1, election: 1 });

// ─────────────────────────────────────────
// VIRTUAL: isFullyVoted
// True only when both commit and reveal are done
// ─────────────────────────────────────────

voterSchema.virtual("isFullyVoted").get(function () {
  return this.phase === "revealed" && !!this.revealTransactionHash;
});

// ─────────────────────────────────────────
// METHOD: clearSensitiveData
// Call after reveal to wipe nonce from DB
// ─────────────────────────────────────────

voterSchema.methods.clearSensitiveData = async function () {
  this.nonce = undefined;
  await this.save();
};

module.exports =
  mongoose.models.Voter ||
  mongoose.model("Voter", voterSchema);