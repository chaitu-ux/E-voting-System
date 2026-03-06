const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { MerkleTree } = require("merkletreejs");

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
  "function verifyOffChainRecord(bytes32 _recordHash, bytes32[] memory _proof) public view returns (bool)",
  "function latestOffChainDataRoot() public view returns (bytes32)",
  "function anchorCount() public view returns (uint)",
  "function lastAnchorBlock() public view returns (uint)",
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
  "event FraudAttemptDetected(bytes32 indexed didHash, string reason, uint timestamp)",
  "event OffChainDataAnchored(bytes32 indexed dataRoot, uint blockNumber, uint timestamp)"
];

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractABI,
  wallet
);

/* =============================================================
   SEND TX — fresh nonce + auto retry on NONCE_EXPIRED
   - Fetches nonce from chain before every TX (never cached)
   - Retries once with "latest" nonce on failure
   - Resets queue after error so future TXs are never blocked
============================================================= */
let txQueue = Promise.resolve();

async function sendTx(txFn) {
  const result = await new Promise((resolve, reject) => {
    txQueue = txQueue
      .then(async () => {
        try {
          const nonce = await provider.getTransactionCount(
            wallet.address,
            "pending"
          );
          const tx = await txFn(nonce);
          resolve(tx);
        } catch (err) {
          if (
            err.code === "NONCE_EXPIRED" ||
            (err.message && err.message.includes("nonce"))
          ) {
            console.warn("⚠️  Nonce error in voterRoutes — retrying...");
            try {
              await new Promise((r) => setTimeout(r, 500));
              const freshNonce = await provider.getTransactionCount(
                wallet.address,
                "latest"
              );
              resolve(await txFn(freshNonce));
            } catch (retryErr) {
              reject(retryErr);
            }
          } else {
            reject(err);
          }
        }
      })
      .catch((err) => {
        txQueue = Promise.resolve();
        reject(err);
      });
  });
  return result;
}

/* =============================================================
   MERKLE TREE HELPERS
   - buildVoteMerkleTree(): builds keccak256 tree over all
     revealed vote commitmentHashes from MongoDB
   - anchorMerkleRoot(): calls anchorOffChainData() on-chain
     with the computed root. Non-fatal — vote is saved first.
   - keccakHash(): wraps ethers.keccak256 for merkletreejs
============================================================= */
function keccakHash(data) {
  return Buffer.from(
    ethers.keccak256(data).replace(/^0x/, ""),
    "hex"
  );
}

async function buildVoteMerkleTree() {
  const allVotes = await Voter.find({ phase: "revealed" }).select(
    "commitmentHash"
  );
  if (allVotes.length === 0) {
    return { tree: null, root: null, leaves: [] };
  }
  const leaves = allVotes.map((v) =>
    Buffer.from(v.commitmentHash.replace(/^0x/, ""), "hex")
  );
  const tree = new MerkleTree(leaves, keccakHash, { sortPairs: true });
  const root = "0x" + tree.getRoot().toString("hex");
  return { tree, root, leaves };
}

async function anchorMerkleRoot() {
  const { tree, root, leaves } = await buildVoteMerkleTree();
  if (!tree || leaves.length === 0) {
    console.log("ℹ️  No votes to anchor yet");
    return null;
  }
  console.log(
    `🌿 Anchoring Merkle root for ${leaves.length} vote(s): ${root}`
  );
  const tx = await sendTx((nonce) =>
    contract.anchorOffChainData(root, { nonce })
  );
  await tx.wait();
  console.log(`✅ Merkle root anchored on-chain — TX: ${tx.hash}`);
  return { txHash: tx.hash, root, totalVotes: leaves.length };
}

/* =============================================================
   GENERAL HELPERS
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
      await sendTx((nonce) =>
        contract.blacklistVoter(didHash, reason, { nonce })
      );
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
      await sendTx((nonce) =>
        contract.reportFraud(didHash, reason, { nonce })
      );
    } catch (chainErr) {
      console.error("Blockchain fraud report error:", chainErr.message);
    }
  }
}

function authenticateStudent(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized - No token" });
  }
  const token = authHeader.split(" ")[1];
  try {
    req.student = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
}

/* =============================================================
   GET /api/voter/status
   - DB is source of truth
   - Auto-heals isDIDRegistered flag if stale
   - Upgrades values from chain (never downgrades)
============================================================= */
router.get("/status", authenticateStudent, async (req, res) => {
  try {
    const student = await Student.findById(req.student.id);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    // Auto-heal: treat as registered if approved + has didHash even
    // if isDIDRegistered flag was not saved (e.g. blockchain failed)
    const isEffectivelyRegistered =
      student.isDIDRegistered === true ||
      (student.status === "approved" && !!student.didHash);

    if (!student.isDIDRegistered && isEffectivelyRegistered) {
      student.isDIDRegistered = true;
      await student.save();
    }

    let statusData = {
      isRegistered: isEffectivelyRegistered,
      isEligible: student.isEligible || false,
      hasVoted: false,
      isBlacklisted: student.isBlacklisted || false,
      fraudScore: student.riskScore || 0,
      didHash: student.didHash || null,
    };

    const activeElection = await Election.findOne({ status: "active" });
    if (activeElection) {
      const voterRecord = await Voter.findOne({
        student: student._id,
        election: activeElection._id,
        phase: "revealed",
      });
      statusData.hasVoted = !!voterRecord;
    }

    // Enhance from chain — only upgrade, never downgrade DB values
    if (student.didHash) {
      try {
        const [
          chainRegistered,
          chainEligible,
          chainVoted,
          chainBlacklisted,
          chainFraudScore,
        ] = await contract.getVoterStatus(student.didHash);

        statusData.isRegistered = statusData.isRegistered || chainRegistered;
        statusData.isEligible = statusData.isEligible || chainEligible;
        statusData.hasVoted = statusData.hasVoted || chainVoted;
        statusData.isBlacklisted =
          statusData.isBlacklisted || chainBlacklisted;
        statusData.fraudScore = Math.max(
          statusData.fraudScore,
          Number(chainFraudScore)
        );
      } catch (chainErr) {
        console.log(
          "Blockchain status unavailable, using DB:",
          chainErr.message
        );
      }
    }

    res.json({ success: true, status: statusData });
  } catch (error) {
    console.error("Voter status error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* =============================================================
   POST /api/voter/register-did
============================================================= */
router.post("/register-did", async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) {
      return res
        .status(400)
        .json({ success: false, message: "studentId required" });
    }
    const student = await Student.findOne({ studentId });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }
    const didHash = generateDIDHash(studentId);

    // Check if already on-chain before registering again
    try {
      const [isRegistered] = await contract.getVoterStatus(didHash);
      if (isRegistered) {
        if (!student.isDIDRegistered) {
          student.isDIDRegistered = true;
          student.didHash = didHash;
          await student.save();
        }
        return res.json({
          success: true,
          message: "DID already registered",
          didHash,
        });
      }
    } catch {}

    const tx = await sendTx((nonce) =>
      contract.registerVoterDID(didHash, { nonce })
    );
    await tx.wait();

    student.didHash = didHash;
    student.isDIDRegistered = true;
    student.didRegisteredAt = new Date();
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
   POST /api/voter/set-eligibility
============================================================= */
router.post("/set-eligibility", async (req, res) => {
  try {
    const { studentId, eligible } = req.body;
    if (!studentId || eligible === undefined) {
      return res.status(400).json({
        success: false,
        message: "studentId and eligible required",
      });
    }
    const didHash = generateDIDHash(studentId);
    const tx = await sendTx((nonce) =>
      contract.setVoterEligibility(didHash, eligible, { nonce })
    );
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
   POST /api/voter/commit-vote
   - Guards: blacklist, election open, eligibility, duplicate
   - Auto-heals DID + eligibility on-chain if missing
     (handles case where admin approval blockchain TX failed)
   - Falls back to DB-only if chain is unavailable
============================================================= */
router.post("/commit-vote", authenticateStudent, async (req, res) => {
  try {
    const student = await Student.findById(req.student.id);
    if (!student)
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    if (student.isBlacklisted)
      return res
        .status(403)
        .json({ success: false, message: "You are blacklisted" });

    const { candidateId } = req.body;
    if (!candidateId)
      return res
        .status(400)
        .json({ success: false, message: "candidateId required" });

    const activeElection = await Election.findOne({ status: "active" });
    if (!activeElection || !activeElection.isOpen) {
      return res
        .status(403)
        .json({ success: false, message: "Election is closed" });
    }
    if (!student.isEligible) {
      return res
        .status(403)
        .json({ success: false, message: "You are not eligible to vote" });
    }

    const candidateDoc = await Candidate.findById(candidateId);
    if (!candidateDoc || candidateDoc.status !== "approved") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or unapproved candidate" });
    }

    const existingVote = await Voter.findOne({
      election: activeElection._id,
      student: student._id,
    });
    if (existingVote) {
      await handleFraud(student, "Duplicate vote attempt", req, true);
      return res
        .status(400)
        .json({ success: false, message: "You have already voted" });
    }

    const didHash = generateDIDHash(student.studentId);
    if (!student.didHash) {
      student.didHash = didHash;
      await student.save();
    }

    // Auto-heal: register DID + eligibility on-chain if missing
    try {
      const [isRegisteredOnChain, isEligibleOnChain] =
        await contract.getVoterStatus(didHash);

      if (!isRegisteredOnChain) {
        console.log("⚠️  DID not on-chain — registering now...");
        const regTx = await sendTx((nonce) =>
          contract.registerVoterDID(didHash, { nonce })
        );
        await regTx.wait();
        console.log("✅ DID registered on-chain (auto-heal):", regTx.hash);
      }

      if (!isEligibleOnChain) {
        console.log("⚠️  Eligibility not set on-chain — setting now...");
        const eligTx = await sendTx((nonce) =>
          contract.setVoterEligibility(didHash, true, { nonce })
        );
        await eligTx.wait();
        console.log(
          "✅ Eligibility set on-chain (auto-heal):",
          eligTx.hash
        );
      }

      if (await contract.hasVoted(didHash)) {
        await handleFraud(
          student,
          "Duplicate vote attempt (Blockchain)",
          req,
          true
        );
        return res
          .status(400)
          .json({ success: false, message: "Already voted on blockchain" });
      }
    } catch (chainErr) {
      console.log(
        "Blockchain pre-check failed, continuing with DB fallback:",
        chainErr.message
      );
    }

    const nonce = generateNonce();
    const blockchainCandidateId = candidateDoc.blockchainId || 1;
    const commitmentHash = computeCommitmentHash(
      didHash,
      blockchainCandidateId,
      nonce
    );

    let commitTxHash = "db-only-" + Date.now();
    let blockNumber = 0;

    try {
      const tx = await sendTx((txNonce) =>
        contract.commitVote(didHash, commitmentHash, { nonce: txNonce })
      );
      const receipt = await tx.wait();
      commitTxHash = tx.hash;
      blockNumber = receipt.blockNumber;
    } catch (chainErr) {
      console.log(
        "Blockchain commit failed, using DB fallback:",
        chainErr.message
      );
    }

    await Voter.create({
      election: activeElection._id,
      student: student._id,
      candidate: candidateDoc._id,
      didHash,
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
   POST /api/voter/reveal-vote
   Flow:
   1. Reveal vote on blockchain (commit-reveal Phase 2)
   2. Save voterRecord.phase = "revealed" to MongoDB
   3. Recount candidate votes
   4. Save student.hasVoted = true
   5. ✅ Build Merkle tree over ALL revealed votes
   6. ✅ Anchor Merkle root on-chain via anchorOffChainData()
   7. Return response with merkleRoot + anchorTxHash
============================================================= */
router.post("/reveal-vote", authenticateStudent, async (req, res) => {
  try {
    const student = await Student.findById(req.student.id);
    if (!student)
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    if (student.isBlacklisted)
      return res
        .status(403)
        .json({ success: false, message: "You are blacklisted" });

    const activeElection = await Election.findOne({ status: "active" });
    if (!activeElection || !activeElection.isOpen) {
      return res
        .status(403)
        .json({ success: false, message: "Election is closed" });
    }

    const voterRecord = await Voter.findOne({
      election: activeElection._id,
      student: student._id,
      phase: "committed",
    });
    if (!voterRecord) {
      return res.status(400).json({
        success: false,
        message: "No commitment found. Please commit first.",
      });
    }

    const didHash = generateDIDHash(student.studentId);
    let revealTxHash = "db-only-" + Date.now();
    let blockNumber = 0;
    let verificationCode = ethers.keccak256(
      ethers.toUtf8Bytes(`${student._id}-${Date.now()}`)
    );

    // Step 1 — Reveal on blockchain
    try {
      const tx = await sendTx((nonce) =>
        contract.revealVote(
          didHash,
          voterRecord.blockchainCandidateId,
          voterRecord.nonce,
          { nonce }
        )
      );
      const receipt = await tx.wait();
      revealTxHash = tx.hash;
      blockNumber = receipt.blockNumber;
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
      console.log(
        "Blockchain reveal failed, using DB fallback:",
        chainErr.message
      );
    }

    // Step 2 — Save to DB
    voterRecord.phase = "revealed";
    voterRecord.revealTransactionHash = revealTxHash;
    voterRecord.verificationCode = verificationCode;
    voterRecord.nonce = undefined;
    await voterRecord.save();

    // Step 3 — Recount candidate votes
    const candidateDoc = await Candidate.findById(voterRecord.candidate);
    if (candidateDoc) {
      candidateDoc.votes = await Voter.countDocuments({
        candidate: candidateDoc._id,
        phase: "revealed",
      });
      await candidateDoc.save();
    }

    // Step 4 — Update student
    student.voteVerificationCode = verificationCode;
    student.hasVoted = true;
    student.votedAt = new Date();
    await student.save();

    // Step 5 & 6 — Build Merkle tree + anchor on-chain
    // Non-fatal — vote is already saved regardless of anchor result
    let merkleRoot = null;
    let anchorTxHash = null;
    try {
      const anchorResult = await anchorMerkleRoot();
      if (anchorResult) {
        merkleRoot = anchorResult.root;
        anchorTxHash = anchorResult.txHash;
      }
    } catch (merkleErr) {
      console.error(
        "Merkle anchoring failed (non-fatal):",
        merkleErr.message
      );
    }

    res.json({
      success: true,
      message: "Vote successfully cast and verified!",
      transactionHash: revealTxHash,
      blockNumber,
      verificationCode,
      merkleRoot,
      anchorTxHash,
      merkleNote: merkleRoot
        ? "Your vote is included in the anchored Merkle root on blockchain"
        : "Vote recorded — Merkle anchor will be updated shortly",
    });
  } catch (error) {
    console.error("Reveal Vote Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* =============================================================
   POST /api/voter/verify-my-vote
   Returns vote receipt + full Merkle inclusion proof
   Proof can be verified on-chain via verifyOffChainRecord()
============================================================= */
router.post("/verify-my-vote", authenticateStudent, async (req, res) => {
  try {
    const { verificationCode } = req.body;
    if (!verificationCode) {
      return res
        .status(400)
        .json({ success: false, message: "verificationCode required" });
    }
    const student = await Student.findById(req.student.id);
    if (!student)
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });

    const voterRecord = await Voter.findOne({
      student: student._id,
      verificationCode,
      phase: "revealed",
    }).populate("candidate");

    if (!voterRecord) {
      return res.status(400).json({
        success: false,
        message: "Vote record not found for this code",
      });
    }

    // Build Merkle proof for this specific vote
    let merkleProof = null;
    let merkleRoot = null;
    let merkleVerified = false;
    try {
      const { tree, root } = await buildVoteMerkleTree();
      if (tree && root) {
        merkleRoot = root;
        const leafBuffer = Buffer.from(
          voterRecord.commitmentHash.replace(/^0x/, ""),
          "hex"
        );
        const proof = tree.getHexProof(leafBuffer);
        merkleVerified = tree.verify(proof, leafBuffer, tree.getRoot());
        merkleProof = proof;
      }
    } catch (merkleErr) {
      console.error("Merkle proof generation failed:", merkleErr.message);
    }

    res.json({
      success: true,
      message: "Your vote is correctly recorded!",
      verificationDetails: {
        isValid: true,
        transactionHash: voterRecord.revealTransactionHash || "DB record",
        candidateId: voterRecord.blockchainCandidateId?.toString(),
        candidateName: voterRecord.candidate?.name || "Unknown",
        verificationCode,
        note: "Your vote identity remains private. Only you can verify using your code.",
      },
      merkleProof: {
        root: merkleRoot,
        proof: merkleProof,
        verified: merkleVerified,
        commitmentHash: voterRecord.commitmentHash,
        explanation:
          "Use this proof with verifyOffChainRecord() on the smart contract to independently confirm your vote is in the anchored dataset.",
      },
    });
  } catch (error) {
    console.error("Verify Vote Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* =============================================================
   GET /api/voter/verify-receipt/:code
============================================================= */
router.get("/verify-receipt/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const voterRecord = await Voter.findOne({
      verificationCode: code,
      phase: "revealed",
    });
    if (voterRecord) {
      return res.json({
        success: true,
        receiptExists: true,
        message: "Receipt is valid.",
      });
    }
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
   GET /api/voter/merkle-root
   Admin dashboard endpoint — shows live Merkle integrity status.
   ?anchor=true → force re-anchor to blockchain (use after restart
   or if isInSync is false)

   Returns:
   - root        : live root computed from DB right now
   - onChainRoot : last root stored on blockchain
   - isInSync    : whether DB and chain match ✅
   - totalVotes  : number of leaves in the tree
   - anchorCount : how many times anchored so far
============================================================= */
router.get("/merkle-root", async (req, res) => {
  try {
    const { tree, root, leaves } = await buildVoteMerkleTree();

    if (!tree || leaves.length === 0) {
      return res.json({
        success: true,
        message: "No votes cast yet — Merkle tree is empty",
        root: null,
        totalVotes: 0,
        onChainRoot: null,
        isInSync: false,
      });
    }

    let onChainRoot = null;
    let onChainAnchorCount = 0;
    let onChainLastAnchorBlock = 0;
    let isInSync = false;

    try {
      onChainRoot = await contract.latestOffChainDataRoot();
      onChainAnchorCount = Number(await contract.anchorCount());
      onChainLastAnchorBlock = Number(await contract.lastAnchorBlock());
      isInSync = onChainRoot === root;
    } catch (chainErr) {
      console.log("Could not fetch on-chain Merkle state:", chainErr.message);
    }

    // Optional force re-anchor via ?anchor=true
    let anchorResult = null;
    if (req.query.anchor === "true") {
      try {
        anchorResult = await anchorMerkleRoot();
        if (anchorResult) {
          onChainRoot = anchorResult.root;
          isInSync = true;
        }
      } catch (anchorErr) {
        console.error("Re-anchor failed:", anchorErr.message);
      }
    }

    res.json({
      success: true,
      root,
      totalVotes: leaves.length,
      onChainRoot,
      onChainAnchorCount,
      onChainLastAnchorBlock,
      isInSync,
      ...(anchorResult && { reAnchor: anchorResult }),
      message: isInSync
        ? "✅ Merkle root is synced with blockchain"
        : "⚠️  Merkle root is out of sync — call with ?anchor=true to re-anchor",
    });
  } catch (error) {
    console.error("Merkle root error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* =============================================================
   GET /api/voter/merkle-proof/:commitmentHash
   Returns Merkle inclusion proof for any commitment hash.
   Also verifies on-chain via verifyOffChainRecord() in Voting.sol
   Used by: admin dashboard, student verify page, external auditors
============================================================= */
router.get("/merkle-proof/:commitmentHash", async (req, res) => {
  try {
    const { commitmentHash } = req.params;
    if (!commitmentHash || !commitmentHash.startsWith("0x")) {
      return res.status(400).json({
        success: false,
        message: "Valid commitmentHash (0x...) required",
      });
    }

    const voterRecord = await Voter.findOne({
      commitmentHash,
      phase: "revealed",
    });
    if (!voterRecord) {
      return res.status(404).json({
        success: false,
        message: "Commitment hash not found in revealed votes",
      });
    }

    const { tree, root, leaves } = await buildVoteMerkleTree();
    if (!tree) {
      return res
        .status(400)
        .json({ success: false, message: "No votes in tree yet" });
    }

    const leafBuffer = Buffer.from(
      commitmentHash.replace(/^0x/, ""),
      "hex"
    );
    const proof = tree.getHexProof(leafBuffer);
    const isValidLocally = tree.verify(proof, leafBuffer, tree.getRoot());

    let isVerifiedOnChain = false;
    try {
      const proofBytes32 = proof.map((p) => ethers.zeroPadValue(p, 32));
      isVerifiedOnChain = await contract.verifyOffChainRecord(
        commitmentHash,
        proofBytes32
      );
    } catch (chainErr) {
      console.log("On-chain verification unavailable:", chainErr.message);
    }

    res.json({
      success: true,
      commitmentHash,
      merkleRoot: root,
      proof,
      totalVotesInTree: leaves.length,
      isValidLocally,
      isVerifiedOnChain,
      message: isValidLocally
        ? "✅ This vote is included in the Merkle tree"
        : "❌ Proof verification failed",
      howToVerify:
        "Call verifyOffChainRecord(commitmentHash, proof) on the smart contract to verify on-chain",
    });
  } catch (error) {
    console.error("Merkle proof error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* =============================================================
   GET /api/voter/results
   Includes merkleRoot in response for frontend display
============================================================= */
router.get("/results", async (req, res) => {
  try {
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

    const results = await Promise.all(
      candidates.map(async (candidate) => {
        const voteCount = await Voter.countDocuments({
          candidate: candidate._id,
          phase: "revealed",
        });
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
      })
    );

    results.sort((a, b) => b.votes - a.votes);

    // Include Merkle root in results for frontend display
    let merkleRoot = null;
    try {
      const { root } = await buildVoteMerkleTree();
      merkleRoot = root;
    } catch {}

    res.json({
      electionTitle: election.title || "University Election",
      totalVotes,
      winner: results[0] || null,
      results,
      merkleRoot,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =============================================================
   GET /api/voter/winner
============================================================= */
router.get("/winner", async (req, res) => {
  try {
    const election = await Election.findOne({
      status: { $in: ["completed", "active"] },
    }).sort({ updatedAt: -1 });

    if (!election) {
      return res
        .status(404)
        .json({ success: false, message: "No election found" });
    }

    const candidates = await Candidate.find({
      election: election._id,
      status: "approved",
    });

    if (!candidates.length) {
      return res
        .status(404)
        .json({ success: false, message: "No candidates found" });
    }

    const candidatesWithVotes = await Promise.all(
      candidates.map(async (c) => {
        const voteCount = await Voter.countDocuments({
          candidate: c._id,
          phase: "revealed",
        });
        return {
          name: c.name,
          votes: voteCount,
          photo: c.photo,
          _id: c._id,
        };
      })
    );

    candidatesWithVotes.sort((a, b) => b.votes - a.votes);
    const winner = candidatesWithVotes[0];
    const electionClosed =
      election.status === "completed" || !election.isOpen;

    return res.json({
      success: true,
      electionClosed,
      winner: {
        name: winner.name,
        votes: winner.votes,
        photo: winner.photo,
        source: "database",
      },
      allCandidates: candidatesWithVotes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;