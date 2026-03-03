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
    <div className="min-h-screen flex items-center justify-center relative fade-page">

      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 text-gray-400 hover:text-white transition duration-300"
      >
        ← Back
      </button>

      <div className="glass-card w-[420px] max-w-[90%]">

        <h1 className="text-3xl font-bold text-center mb-2 tracking-wide">
          Student Login
        </h1>

        <p className="text-center text-gray-400 mb-8">
          Enter your Student ID to receive OTP verification
        </p>

        <div className="space-y-5">
          <input
            type="text"
            placeholder="Enter Student ID"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="modern-input"
          />

          <button
            onClick={handleSendOtp}
            disabled={loading}
            className="modern-btn w-full disabled:opacity-50"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </div>

        {/* Registration Link */}
        <p className="text-center mt-8 text-gray-400">
          New student?{" "}
          <span
            onClick={() => navigate("/student/register")}
            className="text-cyan-400 cursor-pointer hover:underline"
          >
            Register here
          </span>
        </p>

      </div>
    </div>
  );
}

export default StudentLogin;