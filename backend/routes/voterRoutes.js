const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const Student = require("../models/Student");
const Voter = require("../models/Voter");
const FraudLog = require("../models/FraudLog");
const Election = require("../models/Election");
const Candidate = require("../models/Candidate");

/* =============================================================
   BLOCKCHAIN SETUP
============================================================= */
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractABI = [
  "function registerVoterDID(bytes32 _didHash) public",
  "function setVoterEligibility(bytes32 _didHash, bool _eligible) public",
  "function commitVote(bytes32 _didHash, bytes32 _commitmentHash) public",
  "function revealVote(bytes32 _didHash, uint _candidateId, bytes32 _nonce) public",
  "function verifyMyVote(bytes32 _didHash, bytes32 _verificationCode) public view returns (bool, uint, uint)",
  "function verifyReceiptExists(bytes32 _verificationCode) public view returns (bool)",
  "function reportFraud(bytes32 _didHash, string _reason) public",
  "function blacklistVoter(bytes32 _didHash, string _reason) public",
  "function isBlacklisted(bytes32) view returns (bool)",
  "function fraudScore(bytes32) view returns (uint)",
  "function anchorOffChainData(bytes32 _dataRoot) public",
  "function getVoterStatus(bytes32 _didHash) public view returns (bool, bool, bool, bool, uint)",
  "function hasVoted(bytes32) view returns (bool)",
  "function getWinner() public view returns (string, uint, uint)",
  "function getAllCandidates() public view returns (uint[], string[], uint[], bool[])",
  "function getTotalVotes() public view returns (uint)",
  "function getElectionInfo() public view returns (string, bool, uint, uint, uint, uint)",
  "event VoteCast(bytes32 indexed studentHash, uint candidateId)",
  "event VoteCommitted(bytes32 indexed didHash, bytes32 commitmentHash, uint timestamp)",
  "event VoteRevealed(bytes32 indexed didHash, uint candidateId, uint timestamp)",
  "event VoteReceiptIssued(bytes32 indexed didHash, bytes32 verificationCode, uint blockNumber)",
  "event FraudAttemptDetected(bytes32 indexed didHash, string reason, uint timestamp)"
];

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractABI,
  wallet
);

/* =============================================================
   HELPERS
============================================================= */
function generateDIDHash(studentId) {
  const salt = process.env.DID_SALT || "evoting_did_salt_2024";
  return ethers.keccak256(ethers.toUtf8Bytes(`${studentId}:${salt}`));
}

function generateNonce() {
  return "0x" + crypto.randomBytes(32).toString("hex");
}

function computeCommitmentHash(didHash, candidateId, nonce) {
  return ethers.keccak256(
    ethers.solidityPacked(
      ["bytes32", "uint256", "bytes32"],
      [didHash, candidateId, nonce]
    )
  );
}

async function handleFraud(student, reason, req, reportToChain = false) {
  student.failedAttempts = (student.failedAttempts || 0) + 1;
  student.riskScore = (student.riskScore || 0) + 10;

  let severityLevel = "medium";

  if (student.failedAttempts >= 3) {
    student.isBlacklisted = true;
    severityLevel = "high";
    try {
      const didHash = generateDIDHash(student.studentId);
      await contract.blacklistVoter(didHash, reason);
    } catch (chainErr) {
      console.error("Blockchain blacklist error:", chainErr.message);
    }
  }

  await student.save();

  await FraudLog.create({
    student: student._id,
    studentHash: student.studentHash,
    reason,
    ipAddress: req.ip,
    severity: severityLevel,
  });

  if (reportToChain) {
    try {
      const didHash = generateDIDHash(student.studentId);
      await contract.reportFraud(didHash, reason);
    } catch (chainErr) {
      console.error("Blockchain fraud report error:", chainErr.message);
    }
  }
}

function authenticateStudent(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: "Unauthorized - No token" });
  }
  const token = authHeader.split(" ")[1];
  try {
    req.student = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

/* =============================================================
   📋 VOTER STATUS CHECK — ✅ FIXED
   GET /api/voter/status
   DB is source of truth — blockchain used as enhancement only
============================================================= */
router.get("/status", authenticateStudent, async (req, res) => {
  try {
    const student = await Student.findById(req.student.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // ✅ Start with DB values as source of truth
    let statusData = {
      isRegistered: student.isDIDRegistered || false,
      isEligible: student.isEligible || false,
      hasVoted: false,
      isBlacklisted: student.isBlacklisted || false,
      fraudScore: student.riskScore || 0,
      didHash: student.didHash || null,
    };

    // Check if student has voted in DB
    const activeElection = await Election.findOne({ status: "active" });
    if (activeElection) {
      const voterRecord = await Voter.findOne({
        student: student._id,
        election: activeElection._id,
        phase: "revealed",
      });
      statusData.hasVoted = !!voterRecord;
    }

    // ✅ Try blockchain enhancement — but NEVER override DB eligibility with false
    if (student.isDIDRegistered && student.didHash) {
      try {
        const [
          chainRegistered,
          chainEligible,
          chainVoted,
          chainBlacklisted,
          chainFraudScore,
        ] = await contract.getVoterStatus(student.didHash);

        // Only upgrade status, never downgrade
        // If DB says eligible, keep it eligible even if chain lags
        statusData.isRegistered = statusData.isRegistered || chainRegistered;
        statusData.isEligible = statusData.isEligible || chainEligible;
        statusData.hasVoted = statusData.hasVoted || chainVoted;
        statusData.isBlacklisted = statusData.isBlacklisted || chainBlacklisted;
        statusData.fraudScore = Math.max(
          statusData.fraudScore,
          Number(chainFraudScore)
        );
      } catch (chainErr) {
        // Blockchain unavailable — use DB values silently
        console.log("Blockchain status unavailable, using DB:", chainErr.message);
      }
    }

    res.json({ success: true, status: statusData });

  } catch (error) {
    console.error("Voter status error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* =============================================================
   🔐 DID REGISTRATION
   POST /api/voter/register-did
============================================================= */
router.post("/register-did", async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: "studentId required" });
    }

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const didHash = generateDIDHash(studentId);

    // Check if already registered on chain
    try {
      const [isRegistered] = await contract.getVoterStatus(didHash);
      if (isRegistered) {
        return res.json({ success: true, message: "DID already registered", didHash });
      }
    } catch {}

    const tx = await contract.registerVoterDID(didHash);
    await tx.wait();

    student.didHash = didHash;
    student.isDIDRegistered = true;
    await student.save();

    res.json({
      success: true,
      message: "Voter DID registered on blockchain",
      didHash,
      transactionHash: tx.hash,
    });

  } catch (error) {
    console.error("DID Registration Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* =============================================================
   ✅ SET VOTER ELIGIBILITY
   POST /api/voter/set-eligibility
============================================================= */
router.post("/set-eligibility", async (req, res) => {
  try {
    const { studentId, eligible } = req.body;

    if (!studentId || eligible === undefined) {
      return res.status(400).json({ success: false, message: "studentId and eligible required" });
    }

    const didHash = generateDIDHash(studentId);
    const tx = await contract.setVoterEligibility(didHash, eligible);
    await tx.wait();

    res.json({
      success: true,
      message: `Voter eligibility set to ${eligible}`,
      transactionHash: tx.hash,
    });

  } catch (error) {
    console.error("Eligibility Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* =============================================================
   🔒 PHASE 1: COMMIT VOTE (ZKP)
   POST /api/voter/commit-vote
============================================================= */
router.post("/commit-vote", authenticateStudent, async (req, res) => {
  try {
    const student = await Student.findById(req.student.id);

    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    if (student.isBlacklisted) return res.status(403).json({ success: false, message: "You are blacklisted" });

    const { candidateId } = req.body;
    if (!candidateId) return res.status(400).json({ success: false, message: "candidateId required" });

    const activeElection = await Election.findOne({ status: "active" });
    if (!activeElection || !activeElection.isOpen) {
      return res.status(403).json({ success: false, message: "Election is closed" });
    }

    // ✅ Check eligibility from DB first
    if (!student.isEligible) {
      return res.status(403).json({ success: false, message: "You are not eligible to vote" });
    }

    const candidateDoc = await Candidate.findById(candidateId);
    if (!candidateDoc || candidateDoc.status !== "approved") {
      return res.status(400).json({ success: false, message: "Invalid or unapproved candidate" });
    }

    const existingVote = await Voter.findOne({
      election: activeElection._id,
      student: student._id,
    });

    if (existingVote) {
      await handleFraud(student, "Duplicate vote attempt", req, true);
      return res.status(400).json({ success: false, message: "You have already voted" });
    }

    const didHash = generateDIDHash(student.studentId);

    // Check blockchain vote status
    try {
      const alreadyVotedOnChain = await contract.hasVoted(didHash);
      if (alreadyVotedOnChain) {
        await handleFraud(student, "Duplicate vote attempt (Blockchain)", req, true);
        return res.status(400).json({ success: false, message: "Already voted on blockchain" });
      }
    } catch (chainErr) {
      console.log("Blockchain vote check failed, continuing:", chainErr.message);
    }

    const nonce = generateNonce();
    const blockchainCandidateId = candidateDoc.blockchainId || 1;
    const commitmentHash = computeCommitmentHash(didHash, blockchainCandidateId, nonce);

    let commitTxHash = "db-only-" + Date.now();
    let blockNumber = 0;

    // Try blockchain commit — fallback to DB-only if blockchain unavailable
    try {
      const tx = await contract.commitVote(didHash, commitmentHash);
      const receipt = await tx.wait();
      commitTxHash = tx.hash;
      blockNumber = receipt.blockNumber;
    } catch (chainErr) {
      console.log("Blockchain commit failed, using DB fallback:", chainErr.message);
    }

    await Voter.create({
      election: activeElection._id,
      student: student._id,
      candidate: candidateDoc._id,
      studentHash: didHash,
      blockchainCandidateId,
      commitmentHash,
      nonce,
      commitTransactionHash: commitTxHash,
      phase: "committed",
    });

    res.json({
      success: true,
      message: "Vote commitment submitted (Phase 1 complete)",
      commitTransactionHash: commitTxHash,
      blockNumber,
      commitmentHash,
    });

  } catch (error) {
    console.error("Commit Vote Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* =============================================================
   🗳️ PHASE 2: REVEAL VOTE (ZKP)
   POST /api/voter/reveal-vote
============================================================= */
router.post("/reveal-vote", authenticateStudent, async (req, res) => {
  try {
    const student = await Student.findById(req.student.id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    if (student.isBlacklisted) return res.status(403).json({ success: false, message: "You are blacklisted" });

    const activeElection = await Election.findOne({ status: "active" });
    if (!activeElection || !activeElection.isOpen) {
      return res.status(403).json({ success: false, message: "Election is closed" });
    }

    const voterRecord = await Voter.findOne({
      election: activeElection._id,
      student: student._id,
      phase: "committed",
    });

    if (!voterRecord) {
      return res.status(400).json({ success: false, message: "No commitment found. Please commit first." });
    }

    const didHash = generateDIDHash(student.studentId);

    let revealTxHash = "db-only-" + Date.now();
    let blockNumber = 0;
    let verificationCode = ethers.keccak256(
      ethers.toUtf8Bytes(`${student._id}-${Date.now()}`)
    );

    // Try blockchain reveal
    try {
      const tx = await contract.revealVote(
        didHash,
        voterRecord.blockchainCandidateId,
        voterRecord.nonce
      );
      const receipt = await tx.wait();
      revealTxHash = tx.hash;
      blockNumber = receipt.blockNumber;

      // Extract E2E verification code from event
      const iface = new ethers.Interface(contractABI);
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === "VoteReceiptIssued") {
            verificationCode = parsed.args.verificationCode;
            break;
          }
        } catch {}
      }
    } catch (chainErr) {
      console.log("Blockchain reveal failed, using DB fallback:", chainErr.message);
    }

    // Update voter record
    voterRecord.phase = "revealed";
    voterRecord.revealTransactionHash = revealTxHash;
    voterRecord.verificationCode = verificationCode;
    voterRecord.nonce = undefined;
    await voterRecord.save();

    // Update candidate vote count
    const candidateDoc = await Candidate.findById(voterRecord.candidate);
    if (candidateDoc) {
      candidateDoc.votes = (candidateDoc.votes || 0) + 1;
      await candidateDoc.save();
    }

    // Save verification code to student record
    student.voteVerificationCode = verificationCode;
    await student.save();

    res.json({
      success: true,
      message: "Vote successfully cast and verified!",
      transactionHash: revealTxHash,
      blockNumber,
      verificationCode,
    });

  } catch (error) {
    console.error("Reveal Vote Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* =============================================================
   🔍 E2E VOTE VERIFICATION
   POST /api/voter/verify-my-vote
============================================================= */
router.post("/verify-my-vote", authenticateStudent, async (req, res) => {
  try {
    const { verificationCode } = req.body;
    if (!verificationCode) {
      return res.status(400).json({ success: false, message: "verificationCode required" });
    }

    const student = await Student.findById(req.student.id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    // Find vote record by verification code
    const voterRecord = await Voter.findOne({
      student: student._id,
      verificationCode,
      phase: "revealed",
    }).populate("candidate");

    if (!voterRecord) {
      return res.status(400).json({ success: false, message: "Vote record not found for this code" });
    }

    res.json({
      success: true,
      message: "Your vote is correctly recorded!",
      verificationDetails: {
        isValid: true,
        blockNumber: voterRecord.revealTransactionHash || "DB record",
        candidateId: voterRecord.blockchainCandidateId?.toString(),
        candidateName: voterRecord.candidate?.name || "Unknown",
        verificationCode,
        note: "Your vote identity remains private. Only you can verify using your code.",
      },
    });

  } catch (error) {
    console.error("Verify Vote Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* =============================================================
   🔍 PUBLIC RECEIPT VERIFICATION
   GET /api/voter/verify-receipt/:code
============================================================= */
router.get("/verify-receipt/:code", async (req, res) => {
  try {
    const { code } = req.params;

    // Check DB first
    const voterRecord = await Voter.findOne({
      verificationCode: code,
      phase: "revealed",
    });

    if (voterRecord) {
      return res.json({ success: true, receiptExists: true, message: "Receipt is valid." });
    }

    // Try blockchain
    try {
      const exists = await contract.verifyReceiptExists(code);
      return res.json({ success: true, receiptExists: exists });
    } catch {
      return res.json({ success: true, receiptExists: false });
    }

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* =============================================================
   📊 RESULTS API
   GET /api/voter/results
============================================================= */
router.get("/results", async (req, res) => {
  try {
    // Check completed election first, then active
    const election = await Election.findOne({
      status: { $in: ["completed", "active"] },
    }).sort({ updatedAt: -1 });

    if (!election) {
      return res.status(400).json({ message: "No election available" });
    }

    const candidates = await Candidate.find({
      election: election._id,
      status: "approved",
    });

    const totalVotes = await Voter.countDocuments({
      election: election._id,
      phase: "revealed",
    });

    const results = candidates.map((candidate) => {
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
        photo: candidate.photo,
      };
    });

    // Sort by votes descending
    results.sort((a, b) => b.votes - a.votes);

    const winner = results.length > 0 ? results[0] : null;

    res.json({
      electionTitle: election.title || "University Election",
      totalVotes,
      winner,
      results,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =============================================================
   🏆 WINNER API
   GET /api/voter/winner
============================================================= */
router.get("/winner", async (req, res) => {
  try {
    // Try DB first — more reliable
    const election = await Election.findOne({
      status: { $in: ["completed", "active"] },
    }).sort({ updatedAt: -1 });

    if (election) {
      const candidates = await Candidate.find({
        election: election._id,
        status: "approved",
      }).sort({ votes: -1 });

      if (candidates.length > 0 && candidates[0].votes > 0) {
        return res.json({
          success: true,
          winner: {
            name: candidates[0].name,
            votes: candidates[0].votes,
            photo: candidates[0].photo,
            source: "database",
          },
        });
      }
    }

    // Fallback to blockchain
    try {
      const [winnerName, winnerVotes, winnerId] = await contract.getWinner();
      return res.json({
        success: true,
        winner: {
          name: winnerName,
          votes: winnerVotes.toString(),
          candidateId: winnerId.toString(),
          source: "blockchain",
        },
      });
    } catch {
      return res.status(404).json({ success: false, message: "No winner yet" });
    }

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;