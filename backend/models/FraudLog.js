const mongoose = require("mongoose");

const fraudLogSchema = new mongoose.Schema(
  {
    // ✅ ADDED — reference to Student model
    // adminRoutes.js does .populate("student") to show name + studentId
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },

    // Kept for backward compatibility
    studentHash: {
      type: String,
      default: null,
    },

    reason: {
      type: String,
      required: true,
    },

    ipAddress: {
      type: String,
      default: null,
    },

    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast admin fraud log queries
fraudLogSchema.index({ student: 1 });
fraudLogSchema.index({ severity: 1 });
fraudLogSchema.index({ createdAt: -1 });

module.exports =
  mongoose.models.FraudLog ||
  mongoose.model("FraudLog", fraudLogSchema);