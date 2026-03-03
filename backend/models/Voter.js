const mongoose = require("mongoose");

const voterSchema = new mongoose.Schema({
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

  studentHash: {
    type: String,
    required: true,
  },

  transactionHash: {
    type: String,
  },

  votedAt: {
    type: Date,
    default: Date.now,
  },
});

/* 🔒 Prevent double voting in same election */
voterSchema.index(
  { election: 1, student: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.Voter ||
  mongoose.model("Voter", voterSchema);