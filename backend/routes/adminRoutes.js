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

const { verifyToken, verifyRole } = require("../middleware/authMiddleware");

/* =====================================================
   🔥 BLOCKCHAIN SETUP
===================================================== */

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractABI =
  require("../../artifacts/contracts/Voting.sol/Voting.json").abi;

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractABI,
  wallet
);

/* =====================================================
   SUPERADMIN SETUP
===================================================== */

router.post("/setup", async (req, res) => {
  try {
    const existing = await Admin.findOne({ role: "superadmin" });

    if (existing) {
      return res.status(400).json({
        message: "Superadmin already exists",
      });
    }

    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: "superadmin",
    });

    res.status(201).json({
      message: "Superadmin created successfully",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =====================================================
   ADMIN LOGIN
===================================================== */

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }

    const match = await bcrypt.compare(password, admin.password);

    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role,
        tokenVersion: admin.tokenVersion,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ token, role: admin.role });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =====================================================
   CREATE ADMIN
===================================================== */

router.post(
  "/create",
  verifyToken,
  verifyRole("superadmin"),
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      const hashedPassword = await bcrypt.hash(password, 10);

      await Admin.create({
        name,
        email,
        password: hashedPassword,
        role: "admin",
      });

      res.json({ message: "Admin created successfully" });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

/* =====================================================
   GET ALL ADMINS
===================================================== */

router.get(
  "/all",
  verifyToken,
  verifyRole("superadmin"),
  async (req, res) => {
    const admins = await Admin.find().select("-password");
    res.json(admins);
  }
);

/* =====================================================
   DELETE ADMIN
===================================================== */

router.delete(
  "/delete/:id",
  verifyToken,
  verifyRole("superadmin"),
  async (req, res) => {
    try {
      const admin = await Admin.findById(req.params.id);

      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      if (admin.role === "superadmin") {
        return res.status(400).json({
          message: "Cannot delete superadmin",
        });
      }

      await Admin.findByIdAndDelete(req.params.id);

      res.json({ message: "Admin deleted successfully" });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

/* =====================================================
   TRANSFER SUPERADMIN
===================================================== */

router.patch(
  "/transfer-superadmin/:id",
  verifyToken,
  verifyRole("superadmin"),
  async (req, res) => {
    try {
      const newSuper = await Admin.findById(req.params.id);

      if (!newSuper) {
        return res.status(404).json({ message: "Admin not found" });
      }

      await Admin.updateMany(
        { role: "superadmin" },
        { role: "admin" }
      );

      newSuper.role = "superadmin";
      await newSuper.save();

      res.json({ message: "Superadmin transferred successfully" });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

/* =====================================================
   TOGGLE ELECTION (SAFE WINNER HANDLING ADDED)
===================================================== */

router.post(
  "/toggle-election",
  verifyToken,
  verifyRole("superadmin"),
  async (req, res) => {
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

        return res.json({
          success: true,
          isOpen: true,
        });
      }

      election.isOpen = !election.isOpen;
      election.status = election.isOpen ? "active" : "completed";

      /* 🔥 SAFE WINNER CALCULATION */
      if (!election.isOpen) {
        try {
          const winner = await contract.getWinner();
          console.log("Winner from contract:", winner);

          if (Array.isArray(winner)) {
            election.winnerName = winner[0];
            election.winnerVotes = Number(winner[1]);
          } else if (
            typeof winner === "number" ||
            typeof winner === "bigint"
          ) {
            election.winnerName = "Winner ID: " + Number(winner);
            election.winnerVotes = 0;
          } else {
            election.winnerName = "Winner";
            election.winnerVotes = 0;
          }

        } catch (winnerError) {
          console.error("Winner Calculation Error:", winnerError);
          election.winnerName = "Error Fetching Winner";
          election.winnerVotes = 0;
        }
      }

      await election.save();

      res.json({
        success: true,
        isOpen: election.isOpen,
      });

    } catch (error) {
      console.error("🔥 TOGGLE ERROR:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

/* =====================================================
   GET WINNER
===================================================== */

router.get("/election-result", async (req, res) => {
  try {
    const election = await Election.findOne({ status: "completed" });

    if (!election) {
      return res.json({ message: "Election still active" });
    }

    res.json({
      winnerName: election.winnerName,
      winnerVotes: election.winnerVotes,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =====================================================
   STUDENT MANAGEMENT
===================================================== */

router.get("/students", verifyToken, async (req, res) => {
  const students = await Student.find().sort({ createdAt: -1 });
  res.json(students);
});

router.patch("/approve/:id", verifyToken, async (req, res) => {
  await Student.findByIdAndUpdate(req.params.id, {
    status: "approved",
    isEligible: true,
  });
  res.json({ message: "Student approved" });
});

router.patch("/reject/:id", verifyToken, async (req, res) => {
  await Student.findByIdAndUpdate(req.params.id, {
    status: "rejected",
    isEligible: false,
  });
  res.json({ message: "Student rejected" });
});

router.patch("/blacklist/:id", verifyToken, async (req, res) => {
  await Student.findByIdAndUpdate(req.params.id, {
    isBlacklisted: true,
  });
  res.json({ message: "Student blacklisted" });
});

router.patch("/unblacklist/:id", verifyToken, async (req, res) => {
  await Student.findByIdAndUpdate(req.params.id, {
    isBlacklisted: false,
    failedAttempts: 0,
    riskScore: 0,
  });
  res.json({ message: "Student unblocked successfully" });
});

/* =====================================================
   FRAUD LOGS
===================================================== */

router.get("/fraud-logs", verifyToken, async (req, res) => {
  const logs = await FraudLog.find().sort({ createdAt: -1 });
  res.json(logs);
});

/* =====================================================
   VOTE ANALYTICS
===================================================== */

router.get("/vote-analytics", verifyToken, async (req, res) => {
  const totalVotes = await Voter.countDocuments();

  const votesPerCandidate = await Voter.aggregate([
    {
      $group: {
        _id: "$candidate",
        votes: { $sum: 1 },
      },
    },
  ]);

  res.json({
    totalVotes,
    votesPerCandidate,
  });
});

/* =====================================================
   DELETE STUDENT
===================================================== */

router.delete(
  "/delete-student/:id",
  verifyToken,
  async (req, res) => {
    try {
      const student = await Student.findById(req.params.id);

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      await Student.findByIdAndDelete(req.params.id);

      res.json({ message: "Student deleted successfully" });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;