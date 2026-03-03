const mongoose = require("mongoose");

const fraudLogSchema = new mongoose.Schema(
  {
    studentHash: String,
    reason: String,
    ipAddress: String,
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
    },
  },
  {
    timestamps: true, // 🔥 REQUIRED
  }
);

module.exports = mongoose.model("FraudLog", fraudLogSchema);