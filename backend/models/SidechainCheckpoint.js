const mongoose = require("mongoose");

const SidechainCheckpointSchema = new mongoose.Schema(
  {
    checkpointNumber: { type: Number, required: true },
    merkleRoot:       { type: String, required: true },
    txHash:           { type: String, required: true },
    blockNumber:      { type: Number, default: 0 },
    voteCount:        { type: Number, required: true },
    status:           { type: String, enum: ["confirmed", "pending", "failed"], default: "confirmed" },
    triggeredBy:      { type: String, enum: ["auto", "manual"], default: "auto" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SidechainCheckpoint", SidechainCheckpointSchema);