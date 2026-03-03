import React, { useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function StudentRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    studentId: "",
    name: "",
    email: "",
    department: "",
    year: "",
  });

  const [loading, setLoading] = useState(false);

  /* =========================
     Handle Input Change
  ========================= */
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /* =========================
     Validation
  ========================= */
  const validateForm = () => {
    const { studentId, name, email, department, year } = form;

    if (
      !studentId.trim() ||
      !name.trim() ||
      !email.trim() ||
      !department.trim() ||
      !year.trim()
    ) {
      toast.error("All fields are required");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Invalid email format");
      return false;
    }

    if (!["1", "2", "3", "4"].includes(year)) {
      toast.error("Year must be 1, 2, 3 or 4");
      return false;
    }

    return true;
  };

  /* =========================
     Register Student
  ========================= */
  const handleRegister = async () => {
    if (loading) return;
    if (!validateForm()) return;

    try {
      setLoading(true);

      const payload = {
        studentId: form.studentId.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        department: form.department.trim(),
        year: form.year.trim(),
      };

      const res = await api.post("/register", payload);

      toast.success(res.data.message || "Registration successful!");

      setForm({
        studentId: "",
        name: "",
        email: "",
        department: "",
        year: "",
      });

      setTimeout(() => {
        navigate("/student");
      }, 1500);

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center fade-page">
      <div className="container-modern flex justify-center">

        <div className="glass-card w-[500px] max-w-[95%]">

          <h1 className="text-2xl font-bold text-center mb-3 tracking-wide">
            Student Registration 🎓
          </h1>

          <p className="text-center text-gray-400 mb-8">
            Register to participate in secure blockchain voting.
          </p>

          <div className="space-y-5">

            <input
              name="studentId"
              placeholder="Student ID"
              value={form.studentId}
              onChange={handleChange}
              className="modern-input"
            />

            <input
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              className="modern-input"
            />

            <input
              name="email"
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              className="modern-input"
            />

            <input
              name="department"
              placeholder="Department"
              value={form.department}
              onChange={handleChange}
              className="modern-input"
            />

            <input
              name="year"
              placeholder="Year (1-4)"
              value={form.year}
              onChange={handleChange}
              className="modern-input"
            />

            <button
              onClick={handleRegister}
              disabled={loading}
              className="modern-btn w-full disabled:opacity-50"
            >
              {loading ? "Registering..." : "Register"}
            </button>

          </div>

          <p className="text-center mt-6 text-gray-400">
            Already registered?{" "}
            <span
              onClick={() => navigate("/student")}
              className="text-cyan-400 cursor-pointer hover:underline"
            >
              Login here
            </span>
          </p>

        </div>

      </div>
    </div>
  );
}

export default StudentRegister;