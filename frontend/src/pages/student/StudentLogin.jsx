import toast from "react-hot-toast";
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function StudentLogin() {
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    if (!studentId) {
      return toast.error("⚠️ Please enter Student ID");
    }

    try {
      setLoading(true);

      await axios.post("http://localhost:5000/api/send-otp", {
        studentId,
      });

      toast.success("📩 OTP sent to your email!");

      setTimeout(() => {
        navigate("/student/otp", { state: { studentId } });
      }, 800);

    } catch (error) {
      toast.error(
        error.response?.data?.message || "❌ Error sending OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black relative">

      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 text-gray-300 hover:text-white transition"
      >
        ← Back
      </button>

      <div className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-10 w-[400px] text-white">

        <h1 className="text-3xl font-bold text-center mb-2">
          Student Login
        </h1>

        <p className="text-center text-gray-300 mb-6">
          Enter your Student ID to continue
        </p>

        <input
          type="text"
          placeholder="Enter Student ID"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="w-full p-3 rounded-lg bg-white/20 placeholder-gray-300 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <button
          onClick={handleSendOtp}
          disabled={loading}
          className="w-full mt-6 p-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 shadow-lg disabled:opacity-50"
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>

        {/* ✅ Correct Place For Registration Link */}
        <p className="text-center mt-6 text-gray-300">
          New student?{" "}
          <span
            onClick={() => navigate("/student/register")}
            className="text-indigo-400 cursor-pointer hover:underline"
          >
            Register here
          </span>
        </p>

      </div>
    </div>
  );
}

export default StudentLogin;