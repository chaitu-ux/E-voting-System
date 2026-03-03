const express = require("express");
const router = express.Router();

const Candidate = require("../models/Candidate");
const Election = require("../models/Election");
const Student = require("../models/Student");

const upload = require("../middleware/uploadMiddleware");
const { verifyToken, verifyRole } = require("../middleware/authMiddleware");
const { verifyStudent } = require("../middleware/studentAuthMiddleware");

/* ======================================================
   🗳 APPLY AS CANDIDATE (Student Only)
====================================================== */

router.post(
  "/apply",
  verifyStudent, // ✅ FIXED (was verifyToken before)
  upload.single("photo"),
  async (req, res) => {
    try {
      const { manifesto } = req.body;

      if (!manifesto || !req.file) {
        return res.status(400).json({
          message: "Manifesto and photo are required",
        });
      }

      const student = await Student.findById(req.student._id);

      if (!student) {
        return res.status(404).json({
          message: "Student not found",
        });
      }

      if (student.status !== "approved") {
        return res.status(400).json({
          message: "You are not approved by admin",
        });
      }

      if (student.isBlacklisted) {
        return res.status(400).json({
          message: "You are blacklisted",
        });
      }

      const activeElection = await Election.findOne({ status: "active" });

      if (!activeElection) {
        return res.status(400).json({
          message: "No active election currently",
        });
      }

      const existing = await Candidate.findOne({
        election: activeElection._id,
        student: student._id,
      });

      /* 🔁 Reapply logic */
      if (existing) {
        if (existing.status === "rejected") {
          existing.manifesto = manifesto;
          existing.photo = `/uploads/candidates/${req.file.filename}`;
          existing.status = "pending";
          await existing.save();

          return res.json({
            message: "Reapplied successfully",
            candidate: existing,
          });
        }

        return res.status(400).json({
          message: "You already applied for this election",
        });
      }

      const candidate = await Candidate.create({
        election: activeElection._id,
        student: student._id,
        name: student.name,
        department: student.department,
        manifesto,
        photo: `/uploads/candidates/${req.file.filename}`,
        status: "pending",
      });

      res.json({
        message: "Application submitted successfully",
        candidate,
      });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

/* ======================================================
   📌 GET MY APPLICATION STATUS (Student Dashboard)
====================================================== */

router.get(
  "/my-status",
  verifyStudent,
  async (req, res) => {
    try {
      const activeElection = await Election.findOne({ status: "active" });

      if (!activeElection) {
        return res.json({ status: null });
      }

      const candidate = await Candidate.findOne({
        election: activeElection._id,
        student: req.student._id,
      });

      res.json({
        status: candidate?.status || null,
      });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

/* ======================================================
   📋 GET APPROVED CANDIDATES (For Voting Page)
====================================================== */

router.get("/approved", async (req, res) => {
  try {
    const activeElection = await Election.findOne({ status: "active" });

    if (!activeElection) return res.json([]);

    const candidates = await Candidate.find({
      election: activeElection._id,
      status: "approved",
    }).populate("student", "name department year");

    res.json(candidates);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ======================================================
   🛠 ADMIN: GET ALL CANDIDATE APPLICATIONS
====================================================== */

router.get(
  "/all",
  verifyToken,
  verifyRole("admin"),
  async (req, res) => {
    try {
      const candidates = await Candidate.find()
        .populate("student", "name email department")
        .populate("election", "title status")
        .sort({ createdAt: -1 });

      res.json(candidates);

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

/* ======================================================
   ✅ ADMIN APPROVE CANDIDATE
====================================================== */

router.patch(
  "/approve/:id",
  verifyToken,
  verifyRole("admin"),
  async (req, res) => {
    try {
      const candidate = await Candidate.findById(req.params.id);

      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }

      candidate.status = "approved";
      candidate.approvedBy = req.admin._id;
      candidate.approvedAt = new Date();

      await candidate.save();

      res.json({ message: "Candidate approved" });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

/* ======================================================
   ❌ ADMIN REJECT CANDIDATE
====================================================== */

router.patch(
  "/reject/:id",
  verifyToken,
  verifyRole("admin"),
  async (req, res) => {
    try {
      const candidate = await Candidate.findById(req.params.id);

      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }

      candidate.status = "rejected";
      await candidate.save();

      res.json({ message: "Candidate rejected" });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;