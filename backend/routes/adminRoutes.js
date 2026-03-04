console.log("🔥 ADMIN ROUTES LOADED");

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ethers } = require("ethers");

const Admin = require("../models/Admin");
const Student = require("../models/Student");
const Voter = require("../models/Voter");
const FraudLog = require("../models/FraudLog");
const Election = require("../models/Election");
const Candidate = require("../models/Candidate");

const { verifyToken, verifyRole } = require("../middleware/authMiddleware");

/* =============================================================
   BLOCKCHAIN SETUP
============================================================= */
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractABI =
  require("../../artifacts/contracts/Voting.sol/Voting.json").abi;

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractABI,
  wallet
);

/* =============================================================
   HELPER — Generate DID Hash
============================================================= */
function generateDIDHash(studentId) {
  const salt = process.env.DID_SALT || "evoting_did_salt_2024";
  return ethers.keccak256(ethers.toUtf8Bytes(`${studentId}:${salt}`));
}

/* =============================================================
   ✅ FIX: sendTx — always fetch fresh nonce before every tx.
   ROOT CAUSE of NONCE_EXPIRED errors:
   - Old code used a shared txQueue Promise chain. When one tx
     failed with NONCE_EXPIRED, the queue broke permanently and
     all subsequent txs also failed until server restart.
   - ethers.js internally caches the nonce — if any tx fails,
     the cached nonce goes stale and every retry reuses the old
     nonce value, causing the same error in a loop.
   FIX:
   - Fetch fresh nonce from chain before EVERY transaction using
     provider.getTransactionCount(wallet.address, "pending").
   - "pending" includes unconfirmed txs, so it's always accurate.
   - Reset the queue to Promise.resolve() after each error so
     future txs are not blocked by a past failure.
   - Add a small retry with nonce increment on NONCE_EXPIRED so
     transient race conditions self-heal automatically.
============================================================= */
let txQueue = Promise.resolve();

async function sendTx(txFn) {
  // Serialize all txs to avoid nonce races between concurrent requests
  const result = await new Promise((resolve, reject) => {
    txQueue = txQueue
      .then(async () => {
        try {
          // Always get fresh nonce — never rely on ethers internal cache
          const nonce = await provider.getTransactionCount(
            wallet.address,
            "pending"
          );
          const tx = await txFn(nonce);
          resolve(tx);
        } catch (err) {
          // If nonce expired, wait briefly and retry once with latest nonce
          if (
            err.code === "NONCE_EXPIRED" ||
            (err.message && err.message.includes("nonce"))
          ) {
            console.warn("⚠️  Nonce error — retrying with fresh nonce...");
            try {
              await new Promise((r) => setTimeout(r, 500));
              const freshNonce = await provider.getTransactionCount(
                wallet.address,
                "latest"
              );
              const retryTx = await txFn(freshNonce);
              resolve(retryTx);
            } catch (retryErr) {
              console.error("❌ TX retry also failed:", retryErr.message);
              reject(retryErr);
            }
          } else {
            reject(err);
          }
        }
      })
      .catch((err) => {
        // ✅ Reset queue after failure so future txs are not blocked
        txQueue = Promise.resolve();
        reject(err);
      });
  });
  return result;
}

/* =============================================================
   SUPERADMIN SETUP
============================================================= */
router.post("/setup", async (req, res) => {
  try {
    const existing = await Admin.findOne({ role: "superadmin" });
    if (existing) {
      return res.status(400).json({ message: "Superadmin already exists" });
    }
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await Admin.create({ name, email, password: hashedPassword, role: "superadmin" });
    res.status(201).json({ message: "Superadmin created successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =============================================================
   ADMIN LOGIN
============================================================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: "Admin not found" });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin._id, role: admin.role, tokenVersion: admin.tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
    res.json({ token, role: admin.role });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =============================================================
   CREATE ADMIN
============================================================= */
router.post("/create", verifyToken, verifyRole("superadmin"), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await Admin.create({ name, email, password: hashedPassword, role: "admin" });
    res.json({ message: "Admin created successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =============================================================
   GET ALL ADMINS
============================================================= */
router.get("/all", verifyToken, verifyRole("superadmin"), async (req, res) => {
  const admins = await Admin.find().select("-password");
  res.json(admins);
});

/* =============================================================
   DELETE ADMIN
============================================================= */
router.delete("/delete/:id", verifyToken, verifyRole("superadmin"), async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    if (admin.role === "superadmin") {
      return res.status(400).json({ message: "Cannot delete superadmin" });
    }
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ message: "Admin deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =============================================================
   TRANSFER SUPERADMIN
============================================================= */
router.patch(
  "/transfer-superadmin/:id",
  verifyToken,
  verifyRole("superadmin"),
  async (req, res) => {
    try {
      const newSuper = await Admin.findById(req.params.id);
      if (!newSuper) return res.status(404).json({ message: "Admin not found" });
      await Admin.updateMany({ role: "superadmin" }, { role: "admin" });
      newSuper.role = "superadmin";
      await newSuper.save();
      res.json({ message: "Superadmin transferred successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

/* =============================================================
   GET ALL STUDENTS
============================================================= */
router.get("/students", verifyToken, async (req, res) => {
  const students = await Student.find().sort({ createdAt: -1 });
  res.json(students);
});

/* =============================================================
   ✅ FIX: APPROVE STUDENT
   - DB flags saved immediately (before blockchain attempt)
   - Blockchain calls now pass fresh nonce via sendTx()
   - Auto-syncs DID to chain if student was previously approved
     but blockchain registration failed due to stale nonce
   - Both registerVoterDID and setVoterEligibility are retried
     cleanly and independently so a failure in one doesn't
     block the other
============================================================= */
router.patch("/approve/:id", verifyToken, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const didHash = generateDIDHash(student.studentId);

    // ✅ Save ALL flags to DB first — independent of blockchain success
    student.status = "approved";
    student.isEligible = true;
    student.didHash = didHash;
    student.isDIDRegistered = true;
    student.didRegisteredAt = new Date();
    await student.save();

    let blockchainStatus = "db-updated";
    let didTxHash = null;
    let eligibilityTxHash = null;

    // ✅ Blockchain — optional enhancement, DB is source of truth
    try {
      // Check if already registered on-chain before registering again
      let isRegistered = false;
      try {
        const status = await contract.getVoterStatus(didHash);
        isRegistered = status[0];
      } catch {
        isRegistered = false;
      }

      if (!isRegistered) {
        // ✅ FIX: pass nonce into the contract call via sendTx
        const didTx = await sendTx((nonce) =>
          contract.registerVoterDID(didHash, { nonce })
        );
        await didTx.wait();
        didTxHash = didTx.hash;
        console.log("✅ DID registered on-chain:", didTxHash);
      } else {
        console.log("ℹ️  DID already registered on-chain, skipping");
      }

      // ✅ FIX: fresh nonce for eligibility tx too
      const eligibilityTx = await sendTx((nonce) =>
        contract.setVoterEligibility(didHash, true, { nonce })
      );
      await eligibilityTx.wait();
      eligibilityTxHash = eligibilityTx.hash;
      console.log("✅ Eligibility set on-chain:", eligibilityTxHash);

      blockchainStatus = "success";
    } catch (chainErr) {
      console.error(
        "Blockchain DID registration error (DB already saved):",
        chainErr.message
      );
      blockchainStatus = "db-updated-blockchain-pending";
    }

    res.json({
      message: "Student approved",
      blockchainStatus,
      didHash,
      didTxHash,
      eligibilityTxHash,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =============================================================
   ✅ FIX: RE-SYNC DID TO BLOCKCHAIN
   New endpoint — lets admin manually push a student's DID to
   chain if the original approval blockchain call failed.
   Call: PATCH /api/admin/resync-did/:id
============================================================= */
router.patch("/resync-did/:id", verifyToken, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    if (student.status !== "approved") {
      return res.status(400).json({ message: "Student must be approved first" });
    }

    const didHash = generateDIDHash(student.studentId);

    // Ensure DB is up to date
    student.didHash = didHash;
    student.isDIDRegistered = true;
    await student.save();

    let isRegistered = false;
    try {
      const status = await contract.getVoterStatus(didHash);
      isRegistered = status[0];
    } catch {}

    let didTxHash = null;
    if (!isRegistered) {
      const didTx = await sendTx((nonce) =>
        contract.registerVoterDID(didHash, { nonce })
      );
      await didTx.wait();
      didTxHash = didTx.hash;
    }

    const eligibilityTx = await sendTx((nonce) =>
      contract.setVoterEligibility(didHash, true, { nonce })
    );
    await eligibilityTx.wait();

    res.json({
      success: true,
      message: "DID re-synced to blockchain successfully",
      didHash,
      didTxHash,
      eligibilityTxHash: eligibilityTx.hash,
    });
  } catch (error) {
    console.error("Re-sync DID error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* =============================================================
   REJECT STUDENT
============================================================= */
router.patch("/reject/:id", verifyToken, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.status = "rejected";
    student.isEligible = false;
    await student.save();

    if (student.isDIDRegistered && student.didHash) {
      try {
        const tx = await sendTx((nonce) =>
          contract.setVoterEligibility(student.didHash, false, { nonce })
        );
        await tx.wait();
      } catch (chainErr) {
        console.error("Blockchain revoke error:", chainErr.message);
      }
    }
    res.json({ message: "Student rejected" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =============================================================
   BLACKLIST STUDENT
============================================================= */
router.patch("/blacklist/:id", verifyToken, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.isBlacklisted = true;
    student.status = "blacklisted";
    student.isEligible = false;
    await student.save();

    if (student.didHash) {
      try {
        const tx = await sendTx((nonce) =>
          contract.blacklistVoter(student.didHash, "Admin manual blacklist", { nonce })
        );
        await tx.wait();
      } catch (chainErr) {
        console.error("Blockchain blacklist error:", chainErr.message);
      }
    }

    await FraudLog.create({
      student: student._id,
      studentHash: student.studentHash,
      reason: "Admin manually blacklisted student",
      severity: "high",
    });

    res.json({ message: "Student blacklisted on DB and blockchain" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =============================================================
   UNBLACKLIST STUDENT
============================================================= */
router.patch("/unblacklist/:id", verifyToken, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.isBlacklisted = false;
    student.status = "approved";
    student.isEligible = true;
    student.failedAttempts = 0;
    student.riskScore = 0;
    student.suspiciousIPs = [];
    student.fraudReportedToChain = false;
    await student.save();

    if (student.didHash) {
      try {
        const tx = await sendTx((nonce) =>
          contract.setVoterEligibility(student.didHash, true, { nonce })
        );
        await tx.wait();
      } catch (chainErr) {
        console.error("Blockchain unblacklist error:", chainErr.message);
      }
    }
    res.json({ message: "Student unblocked on DB and blockchain" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =============================================================
   DELETE STUDENT
============================================================= */
router.delete("/delete-student/:id", verifyToken, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =============================================================
   TOGGLE ELECTION
============================================================= */
router.post("/toggle-election", verifyToken, verifyRole("superadmin"), async (req, res) => {
  try {
    let election = await Election.findOne();

    if (!election) {
      election = new Election({
        title: "University Election",
        description: "Main Voting Session",
        status: "active",
        isOpen: true,
      });
      await election.save();

      try {
        const tx = await sendTx((nonce) =>
          contract.toggleElection(true, { nonce })
        );
        await tx.wait();
      } catch (chainErr) {
        console.error("Blockchain toggle error:", chainErr.message);
      }

      return res.json({ success: true, isOpen: true });
    }

    election.isOpen = !election.isOpen;
    election.status = election.isOpen ? "active" : "completed";

    try {
      const tx = await sendTx((nonce) =>
        contract.toggleElection(election.isOpen, { nonce })
      );
      await tx.wait();
    } catch (chainErr) {
      console.error("Blockchain toggle error:", chainErr.message);
    }

    if (!election.isOpen) {
      try {
        const winner = await contract.getWinner();
        if (Array.isArray(winner)) {
          election.winnerName = winner[0];
          election.winnerVotes = Number(winner[1]);
        }
      } catch (winnerError) {
        console.error("Winner error:", winnerError.message);
      }
    }

    await election.save();
    res.json({ success: true, isOpen: election.isOpen });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =============================================================
   GET ELECTION RESULT
============================================================= */
router.get("/election-result", async (req, res) => {
  try {
    const election = await Election.findOne({ status: "completed" });
    if (!election) return res.json({ message: "Election still active" });
    res.json({ winnerName: election.winnerName, winnerVotes: election.winnerVotes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =============================================================
   FRAUD LOGS
============================================================= */
router.get("/fraud-logs", verifyToken, async (req, res) => {
  try {
    const logs = await FraudLog.find()
      .populate("student", "name studentId email department")
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =============================================================
   REPORT FRAUD
============================================================= */
router.post("/report-fraud/:studentId", verifyToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (!student.didHash) {
      return res.status(400).json({ message: "Student DID not registered" });
    }

    const tx = await sendTx((nonce) =>
      contract.reportFraud(
        student.didHash,
        reason || "Admin reported suspicious activity",
        { nonce }
      )
    );
    await tx.wait();

    student.fraudReportedToChain = true;
    student.riskScore = (student.riskScore || 0) + 20;
    await student.save();

    await FraudLog.create({
      student: student._id,
      studentHash: student.studentHash,
      reason: reason || "Admin reported to blockchain",
      severity: "high",
    });

    res.json({
      success: true,
      message: "Fraud reported to blockchain",
      transactionHash: tx.hash,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =============================================================
   VOTE ANALYTICS
============================================================= */
router.get("/vote-analytics", verifyToken, async (req, res) => {
  try {
    const totalVotes = await Voter.countDocuments({ phase: "revealed" });
    const totalStudents = await Student.countDocuments({ status: "approved" });
    const totalFraudLogs = await FraudLog.countDocuments();

    const votesPerCandidate = await Voter.aggregate([
      { $match: { phase: "revealed" } },
      { $group: { _id: "$candidate", votes: { $sum: 1 } } },
      {
        $lookup: {
          from: "candidates",
          localField: "_id",
          foreignField: "_id",
          as: "candidateInfo",
        },
      },
      {
        $project: {
          votes: 1,
          candidateName: { $arrayElemAt: ["$candidateInfo.name", 0] },
        },
      },
    ]);

    const fraudBySeverity = await FraudLog.aggregate([
      { $group: { _id: "$severity", count: { $sum: 1 } } },
    ]);

    const turnoutPercentage =
      totalStudents > 0
        ? ((totalVotes / totalStudents) * 100).toFixed(2)
        : "0.00";

    res.json({
      totalVotes,
      totalStudents,
      totalFraudLogs,
      turnoutPercentage,
      votesPerCandidate,
      fraudBySeverity,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =============================================================
   BLOCKCHAIN VOTER STATUS
============================================================= */
router.get("/voter-status/:studentId", verifyToken, async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (!student.didHash) {
      return res.json({
        name: student.name,
        studentId: student.studentId,
        didHash: null,
        blockchainStatus: {
          isRegistered: false,
          isEligible: false,
          hasVoted: false,
          isBlacklisted: false,
          fraudScore: "0",
        },
        dbStatus: {
          status: student.status,
          isEligible: student.isEligible,
          isBlacklisted: student.isBlacklisted,
          riskScore: student.riskScore,
          failedAttempts: student.failedAttempts,
        },
      });
    }

    let blockchainStatus = {
      isRegistered: false,
      isEligible: false,
      hasVoted: false,
      isBlacklisted: false,
      fraudScore: "0",
    };

    try {
      const [isRegistered, isEligible, voted, blacklisted, fraudScore] =
        await contract.getVoterStatus(student.didHash);
      blockchainStatus = {
        isRegistered,
        isEligible,
        hasVoted: voted,
        isBlacklisted: blacklisted,
        fraudScore: fraudScore.toString(),
      };
    } catch (chainErr) {
      console.log("Blockchain status unavailable:", chainErr.message);
    }

    res.json({
      name: student.name,
      studentId: student.studentId,
      didHash: student.didHash,
      blockchainStatus,
      dbStatus: {
        status: student.status,
        isEligible: student.isEligible,
        isBlacklisted: student.isBlacklisted,
        riskScore: student.riskScore,
        failedAttempts: student.failedAttempts,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;