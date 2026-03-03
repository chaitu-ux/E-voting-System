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

    if (!studentId.trim() || !name.trim() || !email.trim() || !department.trim() || !year.trim()) {
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

      // Reset form
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">

      <div className="bg-white/10 backdrop-blur-lg p-10 rounded-2xl w-[450px] shadow-2xl border border-white/20">

        <h1 className="text-2xl font-bold text-center mb-6">
          Student Registration 🎓
        </h1>

        <input
          name="studentId"
          placeholder="Student ID"
          value={form.studentId}
          onChange={handleChange}
          className="input"
        />

        <input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          className="input"
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="input"
        />

        <input
          name="department"
          placeholder="Department"
          value={form.department}
          onChange={handleChange}
          className="input"
        />

        <input
          name="year"
          placeholder="Year (1-4)"
          value={form.year}
          onChange={handleChange}
          className="input"
        />

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full mt-6 p-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="text-center mt-4 text-gray-300">
          Already registered?{" "}
          <span
            onClick={() => navigate("/student")}
            className="text-indigo-400 cursor-pointer hover:underline"
          >
            Login here
          </span>
        </p>

      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 12px;
          margin-bottom: 14px;
          border-radius: 8px;
          background: rgba(255,255,255,0.15);
          color: white;
          outline: none;
        }
      `}</style>

    </div>
  );
}

export default StudentRegister;