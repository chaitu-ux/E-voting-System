const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");

const Candidate = require("../models/Candidate");
const Election = require("../models/Election");
const Student = require("../models/Student");

const upload = require("../middleware/uploadMiddleware");
const { verifyToken, verifyRole } = require("../middleware/authMiddleware");
const { verifyStudent } = require("../middleware/studentAuthMiddleware");

// ✅ Blockchain setup (same as voterRoutes)
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractABI = [
  "function addCandidate(string memory _name, string memory _department) public",
  "function candidatesCount() public view returns (uint)",
  "function candidates(uint) public view returns (uint id, string name, string department, uint voteCount, bool isActive)",
  "function deactivateCandidate(uint _candidateId) public",
];

const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);

// ✅ Nonce-safe tx sender (same pattern as voterRoutes)
let txQueue = Promise.resolve();
async function sendTx(txFn) {
  const result = await new Promise((resolve, reject) => {
    txQueue = txQueue.then(async () => {
      try {
        const nonce = await provider.getTransactionCount(wallet.address, "pending");
        const tx = await txFn(nonce);
        resolve(tx);
      } catch (err) {
        if (err.code === "NONCE_EXPIRED" || (err.message && err.message.includes("nonce"))) {
          console.warn("⚠️  Nonce error — retrying with fresh nonce...");
          try {
            await new Promise((r) => setTimeout(r, 500));
            const freshNonce = await provider.getTransactionCount(wallet.address, "latest");
            resolve(await txFn(freshNonce));
          } catch (retryErr) { reject(retryErr); }
        } else { reject(err); }
      }
    }).catch((err) => { txQueue = Promise.resolve(); reject(err); });
  });
  return result;
}

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
   🔑 FIX: Now also registers candidate on blockchain
          and saves blockchainId back to MongoDB so
          revealVote() never gets "Invalid candidate"
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

      // ✅ FIX: Register candidate on blockchain first
      let blockchainId = candidate.blockchainId || null;
      let blockchainTxHash = null;

      try {
        // Check if already registered on-chain by checking existing blockchainId
        if (!blockchainId) {
          console.log(`🔗 Registering candidate "${candidate.name}" on blockchain...`);

          const tx = await sendTx((nonce) =>
            contract.addCandidate(candidate.name, candidate.department || "N/A", { nonce })
          );
          const receipt = await tx.wait();
          blockchainTxHash = tx.hash;

          // ✅ The new candidateId on-chain = candidatesCount after adding
          // addCandidate() does candidatesCount++ first, so the new ID = candidatesCount
          const newCount = await contract.candidatesCount();
          blockchainId = Number(newCount);

          console.log(`✅ Candidate registered on-chain — blockchainId: ${blockchainId}, TX: ${blockchainTxHash}`);
        } else {
          console.log(`ℹ️  Candidate already has blockchainId: ${blockchainId} — skipping on-chain registration`);
        }
      } catch (chainErr) {
        // Non-fatal: still approve in DB, but log the error
        console.error("⚠️  Blockchain candidate registration failed (non-fatal):", chainErr.message);
      }

      // ✅ Save approval + blockchainId to MongoDB
      candidate.status = "approved";
      candidate.approvedBy = req.admin._id;
      candidate.approvedAt = new Date();
      if (blockchainId) {
        candidate.blockchainId = blockchainId; // ✅ This is what voterRoutes uses for revealVote
      }

      await candidate.save();

      res.json({
        message: "Candidate approved",
        blockchainId: blockchainId || null,
        blockchainTxHash: blockchainTxHash || null,
        blockchainNote: blockchainId
          ? `Candidate registered on-chain with ID ${blockchainId}`
          : "Blockchain registration failed — vote reveal may use fallback",
      });

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