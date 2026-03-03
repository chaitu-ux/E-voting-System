const mongoose = require("mongoose");

const electionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["upcoming", "active", "completed"],
      default: "upcoming",
    },

    isOpen: {
      type: Boolean,
      default: false,
    },

    startDate: {
      type: Date,
    },

    endDate: {
      type: Date,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    /* =========================================
       🏆 WINNER FIELDS (ADDED)
    ========================================= */

    winnerName: {
      type: String,
      default: null,
    },

    winnerVotes: {
      type: Number,
      default: 0,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/* =========================================
   🔒 Ensure Only One Active Election
   FIXED VERSION (NO next())
========================================= */

electionSchema.pre("save", async function () {
  if (this.status === "active") {
    await mongoose.model("Election").updateMany(
      {
        status: "active",
        _id: { $ne: this._id },
      },
      {
        status: "completed",
        isOpen: false,
      }
    );
  }
});

/* =========================================
   Prevent OverwriteModelError
========================================= */

module.exports =
  mongoose.models.Election ||
  mongoose.model("Election", electionSchema);