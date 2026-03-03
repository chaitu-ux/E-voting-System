router.post("/verify", async (req, res) => {
  const { studentId } = req.body;

  const studentHash = ethers.keccak256(
    ethers.toUtf8Bytes(studentId)
  );

  const student = await Student.findOne({ studentHash });

  if (!student) {
    return res.status(404).json({ eligible: false });
  }

  if (!student.isEligible) {
    return res.status(403).json({ eligible: false });
  }

  res.json({ eligible: true });
});