const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const jwt = require("jsonwebtoken");

const Student = require("../models/Student");
const Voter = require("../models/Voter");
const FraudLog = require("../models/FraudLog");
const Election = require("../models/Election");
const Candidate = require("../models/Candidate");

/* =========================
   Blockchain Setup
========================= */

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

const wallet = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  provider
);

const contractABI = [
  "function vote(bytes32 _studentHash, uint _candidateId) public",
  "function hasVoted(bytes32) view returns (bool)"
];

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractABI,
  wallet
);

/* =========================
   🚨 FRAUD HANDLER FUNCTION (UPDATED ENUM FIX)
========================= */

async function handleFraud(student, reason, req) {

  student.failedAttempts = (student.failedAttempts || 0) + 1;
  student.riskScore = (student.riskScore || 0) + 10;

  let severityLevel = "medium";

  if (student.failedAttempts >= 3) {
    student.isBlacklisted = true;
    severityLevel = "high";
  }

  await student.save();

  await FraudLog.create({
    student: student._id,
    studentHash: student.studentHash,
    reason,
    ipAddress: req.ip,
    severity: severityLevel   // ✅ FIXED (lowercase enum)
  });
}

/* =====================================================
   🗳 VOTE API (UNCHANGED LOGIC + FRAUD FIX)
===================================================== */

router.post("/vote", async (req, res) => {
  try {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No token"
      });
    }

    const token = authHeader.split(" ")[1];

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    const student = await Student.findById(decoded.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    if (student.isBlacklisted) {
      return res.status(403).json({
        success: false,
        message: "You are blacklisted"
      });
    }

    const { candidate } = req.body;

    if (!candidate) {
      return res.status(400).json({
        success: false,
        message: "Candidate required"
      });
    }

    const activeElection = await Election.findOne({ status: "active" });

    if (!activeElection || !activeElection.isOpen) {
      return res.status(403).json({
        success: false,
        message: "Election is closed"
      });
    }

    const candidateDoc = await Candidate.findById(candidate);

    if (!candidateDoc || candidateDoc.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Invalid candidate"
      });
    }

    const existingVote = await Voter.findOne({
      election: activeElection._id,
      student: student._id
    });

    /* 🚨 FRAUD CHECK - DATABASE */
    if (existingVote) {

      await handleFraud(student, "Duplicate vote attempt (Database)", req);

      return res.status(400).json({
        success: false,
        message: "Already voted"
      });
    }

    const alreadyVotedOnChain = await contract.hasVoted(student.studentHash);

    /* 🚨 FRAUD CHECK - BLOCKCHAIN */
    if (alreadyVotedOnChain) {

      await handleFraud(student, "Duplicate vote attempt (Blockchain)", req);

      return res.status(400).json({
        success: false,
        message: "Already voted (Blockchain)"
      });
    }

    const tx = await contract.vote(student.studentHash, 1);
    const receipt = await tx.wait();

    await Voter.create({
      election: activeElection._id,
      student: student._id,
      candidate: candidateDoc._id,
      studentHash: student.studentHash,
      transactionHash: tx.hash
    });

    candidateDoc.votes += 1;
    await candidateDoc.save();

    res.json({
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber
    });

  } catch (error) {
    console.error("Vote Error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* =====================================================
   🏁 RESULT API
===================================================== */

router.get("/results", async (req, res) => {
  try {

    const completedElection = await Election.findOne({
      status: "completed"
    }).sort({ updatedAt: -1 });

    if (!completedElection) {
      return res.status(400).json({
        message: "No completed election available"
      });
    }

    const candidates = await Candidate.find({
      election: completedElection._id,
      status: "approved"
    });

    const totalVotes = await Voter.countDocuments({
      election: completedElection._id
    });

    const results = candidates.map(candidate => {

      const voteCount = candidate.votes || 0;

      const percentage =
        totalVotes > 0
          ? ((voteCount / totalVotes) * 100).toFixed(2)
          : "0.00";

      return {
        id: candidate._id,
        name: candidate.name,
        votes: voteCount,
        percentage,
        photo: candidate.photo
      };
    });

    let winner = null;

    if (results.length > 0) {
      winner = [...results].sort((a, b) => b.votes - a.votes)[0];
    }

    res.json({
      electionTitle: completedElection.title,
      totalVotes,
      winner,
      results
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;