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
    <div className="min-h-screen flex items-center justify-center fade-page">

      <div className="glass-card w-[420px] max-w-[90%] text-center">

        <h1 className="text-3xl font-bold mb-2 tracking-wide">
          OTP Verification
        </h1>

        <p className="text-gray-400 mb-8">
          Enter the One-Time Password sent to your registered email
        </p>

        <div className="space-y-6">
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="modern-input text-center tracking-[0.4em] text-lg font-semibold"
          />

          <button
            onClick={handleVerifyOtp}
            disabled={loading}
            className="modern-btn w-full disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default OtpVerification;