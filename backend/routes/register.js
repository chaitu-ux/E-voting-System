const express = require("express");
const router = express.Router();
const { ethers } = require("ethers");
const Student = require("../models/Student");

router.post("/register", async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID required" });
    }

    // 1️⃣ Hash Student ID (Privacy Preserving)
    const studentHash = ethers.keccak256(
      ethers.toUtf8Bytes(studentId)
    );

    // 2️⃣ Check if already registered
    const exists = await Student.findOne({ studentHash });
    if (exists) {
      return res.status(400).json({ message: "Already registered" });
    }

    // 3️⃣ Create DID
    const did = `did:university:${studentHash}`;

    // 4️⃣ Save student
    const student = new Student({
      did,
      studentHash,
      isEligible: true
    });

    await student.save();

    res.status(201).json({
      message: "Registration successful",
      did
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;