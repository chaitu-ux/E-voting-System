import toast from "react-hot-toast";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

function OtpVerification() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const studentId = location.state?.studentId;

  /* =========================
     Redirect if no studentId
  ========================= */
  useEffect(() => {
    if (!studentId) {
      navigate("/student");
    }
  }, [studentId, navigate]);

  const handleVerifyOtp = async () => {
    if (!otp) {
      return toast.error("⚠️ Please enter OTP");
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/api/verify-otp",
        {
          studentId,
          otp,
        }
      );

      toast.success("✅ OTP Verified Successfully!");

      /* =========================
         SAVE TOKEN (IMPORTANT)
      ========================= */

      if (res.data.token) {
        localStorage.setItem("studentToken", res.data.token);
      }

      /* =========================
         GO TO DASHBOARD
      ========================= */

      setTimeout(() => {
        navigate("/student/dashboard");
      }, 800);

    } catch (error) {
      toast.error(
        error.response?.data?.message || "❌ OTP Verification Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black">
      <div className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-10 w-[400px] text-white">

        <h1 className="text-3xl font-bold text-center mb-2">
          OTP Verification
        </h1>

        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full p-3 rounded-lg bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-center tracking-widest"
        />

        <button
          onClick={handleVerifyOtp}
          disabled={loading}
          className="w-full mt-6 p-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 shadow-lg disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

      </div>
    </div>
  );
}

export default OtpVerification;