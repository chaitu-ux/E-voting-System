const jwt = require("jsonwebtoken");
const Student = require("../models/Student");

exports.verifyStudent = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const student = await Student.findById(decoded.id);

    if (!student) {
      return res.status(401).json({ message: "Student not found" });
    }

    req.student = student;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};