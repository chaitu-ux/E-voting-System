const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Student = require("../models/Student");

exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔹 ADMIN LOGIN
    if (decoded.role === "admin" || decoded.role === "superadmin") {
      const admin = await Admin.findById(decoded.id);

      if (!admin) {
        return res.status(401).json({ message: "Admin not found" });
      }

      if (admin.tokenVersion !== decoded.tokenVersion) {
        return res.status(401).json({
          message: "Token expired due to role/password change",
        });
      }

      req.admin = admin;
      req.role = admin.role;
      return next();
    }

    // 🔹 STUDENT LOGIN
    if (decoded.role === "student") {
      const student = await Student.findById(decoded.id);

      if (!student) {
        return res.status(401).json({ message: "Student not found" });
      }

      req.student = student;
      req.role = "student";
      return next();
    }

    return res.status(403).json({ message: "Invalid role" });

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

exports.verifyRole = (role) => {
  return (req, res, next) => {
    if (req.role !== role) {
      return res.status(403).json({
        message: "Access denied",
      });
    }
    next();
  };
};