const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    election: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: true,
      index: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    manifesto: {
      type: String,
      required: true,
      trim: true,
    },

    photo: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // replaces createdAt manually
  }
);

/* =====================================
   Prevent Duplicate Application
   One Student per Election
===================================== */

candidateSchema.index(
  { student: 1, election: 1 },
  { unique: true }
);

/* =====================================
   Prevent OverwriteModelError
===================================== */

module.exports =
  mongoose.models.Candidate ||
  mongoose.model("Candidate", candidateSchema);